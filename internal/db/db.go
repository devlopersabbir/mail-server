package db

import (
	"context"
	"log"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Storage struct {
	MongoClient     *mongo.Client
	MongoCollection *mongo.Collection
	RedisClient     *redis.Client
}

var instance *Storage

func InitDB() *Storage {
	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		mongoURI = "mongodb://mongodb-loadbalancer-svc.mail-server.svc.cluster.local:27017"
	}

	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "redis-server.mail-server.svc.cluster.local:6379"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Initialize MongoDB
	log.Printf("[DB] Connecting to MongoDB at %s...", mongoURI)
	mongoClient, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		log.Printf("[DB WARNING] Failed to create MongoDB client: %v", err)
	} else if err := mongoClient.Ping(ctx, nil); err != nil {
		log.Printf("[DB WARNING] Failed to ping MongoDB: %v (Continuing with fallback)", err)
	} else {
		log.Println("[DB SUCCESS] Connected to MongoDB successfully!")
	}

	mongoCollection := mongoClient.Database("mailserver").Collection("jobs")

	// Initialize Redis
	log.Printf("[DB] Connecting to Redis at %s...", redisAddr)
	redisClient := redis.NewClient(&redis.Options{
		Addr:     redisAddr,
		Password: "",
		DB:       0,
	})

	if err := redisClient.Ping(ctx).Err(); err != nil {
		log.Printf("[DB WARNING] Failed to ping Redis: %v (Continuing with fallback)", err)
	} else {
		log.Println("[DB SUCCESS] Connected to Redis successfully!")
	}

	instance = &Storage{
		MongoClient:     mongoClient,
		MongoCollection: mongoCollection,
		RedisClient:     redisClient,
	}

	return instance
}

func GetStorage() *Storage {
	if instance == nil {
		return InitDB()
	}
	return instance
}
