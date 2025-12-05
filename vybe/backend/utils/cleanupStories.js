import Story from '../models/story.model.js';

// Ensure TTL index exists for automatic story deletion after 24 hours
export const ensureStoryTTLIndex = async () => {
    try {
        // Check if index exists
        const indexes = await Story.collection.getIndexes();
        const hasTTLIndex = Object.keys(indexes).some(key =>
            indexes[key].some(field => field.expireAfterSeconds !== undefined)
        );

        if (!hasTTLIndex) {
            // Create TTL index on createdAt field
            await Story.collection.createIndex(
                { createdAt: 1 },
                { expireAfterSeconds: 86400 } // 24 hours
            );
            console.log('✅ Story TTL index created - stories will auto-delete after 24 hours');
        } else {
            console.log('✅ Story TTL index already exists');
        }
    } catch (error) {
        console.error('Error ensuring story TTL index:', error);
    }
};

// Manual cleanup function (backup)
export const cleanupOldStories = async () => {
    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const result = await Story.deleteMany({
            createdAt: { $lt: twentyFourHoursAgo }
        });

        if (result.deletedCount > 0) {
            console.log(`🗑️  Cleaned up ${result.deletedCount} old stories`);
        }
        return result.deletedCount;
    } catch (error) {
        console.error('Error cleaning up old stories:', error);
        return 0;
    }
};
