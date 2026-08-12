package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"mail-server/internal/db"
	"mail-server/internal/model"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type JobRepository struct {
	storage *db.Storage
}

func NewJobRepository(storage *db.Storage) *JobRepository {
	return &JobRepository{storage: storage}
}

// SaveJob persists job into MongoDB and caches it in Redis
func (r *JobRepository) SaveJob(job *model.Job) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// 1. Save / Upsert to MongoDB
	if r.storage.MongoCollection != nil {
		opts := options.Update().SetUpsert(true)
		filter := bson.M{"id": job.ID}
		update := bson.M{"$set": job}

		_, err := r.storage.MongoCollection.UpdateOne(ctx, filter, update, opts)
		if err != nil {
			log.Printf("[Repository Error] MongoDB SaveJob failed for %s: %v", job.ID, err)
		}
	}

	// 2. Cache in Redis (1 hour TTL)
	r.CacheJob(job)

	return nil
}

// CacheJob stores job JSON string in Redis
func (r *JobRepository) CacheJob(job *model.Job) {
	if r.storage.RedisClient == nil {
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	data, err := json.Marshal(job)
	if err != nil {
		return
	}

	redisKey := fmt.Sprintf("job:%s", job.ID)
	r.storage.RedisClient.Set(ctx, redisKey, data, 1*time.Hour)
}

// GetJob retrieves job (Checks Redis cache first -> MongoDB fallback)
func (r *JobRepository) GetJob(jobID string) (*model.Job, bool) {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	redisKey := fmt.Sprintf("job:%s", jobID)

	// Step 1: Check Redis Cache
	if r.storage.RedisClient != nil {
		val, err := r.storage.RedisClient.Get(ctx, redisKey).Result()
		if err == nil && val != "" {
			var job model.Job
			if jsonErr := json.Unmarshal([]byte(val), &job); jsonErr == nil {
				return &job, true
			}
		}
	}

	// Step 2: Cache Miss -> Fallback to MongoDB
	if r.storage.MongoCollection != nil {
		var job model.Job
		err := r.storage.MongoCollection.FindOne(ctx, bson.M{"id": jobID}).Decode(&job)
		if err == nil {
			// Populate Redis cache for next lookup
			r.CacheJob(&job)
			return &job, true
		}
	}

	return nil, false
}
