import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDatabase } from '../../db/test-helpers';
import { categories, publishers, games } from '../../db/schema';
import { eq, sql } from 'drizzle-orm';
import type { Database } from './db';
import {
    getAllGames,
    getAllGameIds,
    getGameById,
    getGamesByCategory,
    getGamesByPublisher,
    getGamesByCategoryAndPublisher,
    getAllCategories,
    getAllPublishers,
} from './games';

async function seedGames(db: Database, count: number): Promise<void> {
    const [category] = await db
        .insert(categories)
        .values({ name: 'Strategy', description: 'cat' })
        .returning({ id: categories.id });
    const [publisher] = await db
        .insert(publishers)
        .values({ name: 'Pub One', description: 'pub' })
        .returning({ id: publishers.id });

    // Insert titles in reverse-alphabetical order to prove ordering is applied.
    for (let i = count; i >= 1; i--) {
        await db.insert(games).values({
            title: `Game ${String(i).padStart(2, '0')}`,
            description: `Description ${i}`,
            starRating: 4.2,
            categoryId: category.id,
            publisherId: publisher.id,
        });
    }
}

describe('games data-access helpers', () => {
    let db: Database;

    beforeEach(async () => {
        db = await createTestDatabase();
    });

    it('returns all games ordered by title', async () => {
        await seedGames(db, 3);
        const all = await getAllGames(db);
        expect(all.map((g) => g.title)).toEqual(['Game 01', 'Game 02', 'Game 03']);
        expect(all[0].category).toEqual({ id: expect.any(Number), name: 'Strategy' });
        expect(all[0].publisher).toEqual({ id: expect.any(Number), name: 'Pub One' });
    });

    it('returns all game ids ordered by title', async () => {
        await seedGames(db, 3);
        const ids = await getAllGameIds(db);
        const all = await getAllGames(db);
        expect(ids).toEqual(all.map((g) => g.id));
    });

    it('fetches a single game by id', async () => {
        await seedGames(db, 2);
        const ids = await getAllGameIds(db);
        const game = await getGameById(db, ids[0]);
        expect(game?.title).toBe('Game 01');
    });

    it('returns null for a non-existent game', async () => {
        await seedGames(db, 2);
        expect(await getGameById(db, 99999)).toBeNull();
    });

    it('returns games filtered by category', async () => {
        // Create two categories
        const [strategyCategory] = await db
            .insert(categories)
            .values({ name: 'Strategy', description: 'cat' })
            .returning({ id: categories.id });
        const [rpgCategory] = await db
            .insert(categories)
            .values({ name: 'RPG', description: 'rpg' })
            .returning({ id: categories.id });

        // Create a publisher
        const [publisher] = await db
            .insert(publishers)
            .values({ name: 'Pub One', description: 'pub' })
            .returning({ id: publishers.id });

        // Insert games in both categories
        await db.insert(games).values([
            {
                title: 'Strategy Game 1',
                description: 'Desc 1',
                starRating: 4.2,
                categoryId: strategyCategory.id,
                publisherId: publisher.id,
            },
            {
                title: 'Strategy Game 2',
                description: 'Desc 2',
                starRating: 4.0,
                categoryId: strategyCategory.id,
                publisherId: publisher.id,
            },
            {
                title: 'RPG Game 1',
                description: 'Desc 3',
                starRating: 4.5,
                categoryId: rpgCategory.id,
                publisherId: publisher.id,
            },
        ]);

        // Get games by strategy category
        const strategyGames = await getGamesByCategory(db, strategyCategory.id);
        expect(strategyGames.length).toBe(2);
        expect(strategyGames.every(g => g.category?.id === strategyCategory.id)).toBe(true);
        expect(strategyGames.map(g => g.title)).toEqual(['Strategy Game 1', 'Strategy Game 2']);

        // Get games by RPG category
        const rpgGames = await getGamesByCategory(db, rpgCategory.id);
        expect(rpgGames.length).toBe(1);
        expect(rpgGames[0].category?.id).toBe(rpgCategory.id);
        expect(rpgGames[0].title).toBe('RPG Game 1');
    });

    it('returns games filtered by publisher', async () => {
        // Create a category
        const [category] = await db
            .insert(categories)
            .values({ name: 'Strategy', description: 'cat' })
            .returning({ id: categories.id });

        // Create two publishers
        const [pubOne] = await db
            .insert(publishers)
            .values({ name: 'Pub One', description: 'pub' })
            .returning({ id: publishers.id });
        const [pubTwo] = await db
            .insert(publishers)
            .values({ name: 'Pub Two', description: 'pub2' })
            .returning({ id: publishers.id });

        // Insert games for both publishers
        await db.insert(games).values([
            {
                title: 'Pub One Game 1',
                description: 'Desc 1',
                starRating: 4.2,
                categoryId: category.id,
                publisherId: pubOne.id,
            },
            {
                title: 'Pub One Game 2',
                description: 'Desc 2',
                starRating: 4.0,
                categoryId: category.id,
                publisherId: pubOne.id,
            },
            {
                title: 'Pub Two Game 1',
                description: 'Desc 3',
                starRating: 4.5,
                categoryId: category.id,
                publisherId: pubTwo.id,
            },
        ]);

        // Get games by Pub One
        const pubOneGames = await getGamesByPublisher(db, pubOne.id);
        expect(pubOneGames.length).toBe(2);
        expect(pubOneGames.every(g => g.publisher?.id === pubOne.id)).toBe(true);
        expect(pubOneGames.map(g => g.title)).toEqual(['Pub One Game 1', 'Pub One Game 2']);

        // Get games by Pub Two
        const pubTwoGames = await getGamesByPublisher(db, pubTwo.id);
        expect(pubTwoGames.length).toBe(1);
        expect(pubTwoGames[0].publisher?.id).toBe(pubTwo.id);
        expect(pubTwoGames[0].title).toBe('Pub Two Game 1');
    });

    it('returns games filtered by category and publisher', async () => {
        // Create two categories
        const [strategyCategory] = await db
            .insert(categories)
            .values({ name: 'Strategy', description: 'cat' })
            .returning({ id: categories.id });
        const [rpgCategory] = await db
            .insert(categories)
            .values({ name: 'RPG', description: 'rpg' })
            .returning({ id: categories.id });

        // Create two publishers
        const [pubOne] = await db
            .insert(publishers)
            .values({ name: 'Pub One', description: 'pub' })
            .returning({ id: publishers.id });
        const [pubTwo] = await db
            .insert(publishers)
            .values({ name: 'Pub Two', description: 'pub2' })
            .returning({ id: publishers.id });

        // Insert games for all combinations
        await db.insert(games).values([
            {
                title: 'Strategy Pub One',
                description: 'Desc 1',
                starRating: 4.2,
                categoryId: strategyCategory.id,
                publisherId: pubOne.id,
            },
            {
                title: 'Strategy Pub Two',
                description: 'Desc 2',
                starRating: 4.0,
                categoryId: strategyCategory.id,
                publisherId: pubTwo.id,
            },
            {
                title: 'RPG Pub One',
                description: 'Desc 3',
                starRating: 4.5,
                categoryId: rpgCategory.id,
                publisherId: pubOne.id,
            },
            {
                title: 'RPG Pub Two',
                description: 'Desc 4',
                starRating: 4.3,
                categoryId: rpgCategory.id,
                publisherId: pubTwo.id,
            },
        ]);

        console.log('strategyCategory.id:', strategyCategory.id);
        console.log('rpgCategory.id:', rpgCategory.id);
        console.log('pubOne.id:', pubOne.id);
        console.log('pubTwo.id:', pubTwo.id);
        // Debug: see what games we have
        const allGames = await db.select({ id: games.id, categoryId: games.categoryId, publisherId: games.publisherId }).from(games);
        console.log('All Games:', allGames);
        // Manual query with the same conditions
        const manualQuery = await db
            .select({ id: games.id, title: games.title, categoryId: games.categoryId, publisherId: games.publisherId })
            .from(games)
            .leftJoin(categories, eq(games.categoryId, categories.id))
            .leftJoin(publishers, eq(games.publisherId, publishers.id))
            .where(sql`${games.categoryId} = ${strategyCategory.id} AND ${games.publisherId} = ${pubOne.id}`);
        console.log('Manual Query Results:', manualQuery);
        // Get strategy games from Pub One
        const strategyPubOneGames = await getGamesByCategoryAndPublisher(db, strategyCategory.id, pubOne.id);
        console.log('Strategy Pub One Games from function:', strategyPubOneGames.map(g => ({ id: g.id, title: g.title, categoryId: g.category?.id, publisherId: g.publisher?.id })));

        // Let's also try with only categoryId
        const gamesByCategoryOnly = await getGamesByCategory(db, strategyCategory.id);
        console.log('Games by category only (strategy):', gamesByCategoryOnly.map(g => ({ id: g.id, title: g.title, categoryId: g.category?.id, publisherId: g.publisher?.id })));

        // And only publisherId
        const gamesByPublisherOnly = await getGamesByPublisher(db, pubOne.id);
        console.log('Games by publisher only (pubOne):', gamesByPublisherOnly.map(g => ({ id: g.id, title: g.title, categoryId: g.category?.id, publisherId: g.publisher?.id })));

        expect(strategyPubOneGames.length).toBe(1);
        expect(strategyPubOneGames[0].category?.id).toBe(strategyCategory.id);
        expect(strategyPubOneGames[0].publisher?.id).toBe(pubOne.id);
        expect(strategyPubOneGames[0].title).toBe('Strategy Pub One');

        // Get RPG games from Pub Two
        const rpgPubTwoGames = await getGamesByCategoryAndPublisher(db, rpgCategory.id, pubTwo.id);
        console.log('RPG Pub Two Games from function:', rpgPubTwoGames.map(g => ({ id: g.id, title: g.title, categoryId: g.category?.id, publisherId: g.publisher?.id })));
        expect(rpgPubTwoGames.length).toBe(1);
        expect(rpgPubTwoGames[0].category?.id).toBe(rpgCategory.id);
        expect(rpgPubTwoGames[0].publisher?.id).toBe(pubTwo.id);
        expect(rpgPubTwoGames[0].title).toBe('RPG Pub Two');
    });

    it('returns all categories ordered by name', async () => {
        // Insert categories in reverse alphabetical order
        await db.insert(categories).values([
            { name: 'Strategy', description: 'strat' },
            { name: 'RPG', description: 'role playing' },
            { name: 'Action', description: 'action' },
        ]);

        const allCategories = await getAllCategories(db);
        expect(allCategories.length).toBe(3);
        expect(allCategories.map(c => c.name)).toEqual(['Action', 'RPG', 'Strategy']);
    });

    it('returns all publishers ordered by name', async () => {
        // Insert publishers in reverse alphabetical order
        await db.insert(publishers).values([
            { name: 'Pub Z', description: 'z pub' },
            { name: 'Pub A', description: 'a pub' },
            { name: 'Pub M', description: 'm pub' },
        ]);

        const allPublishers = await getAllPublishers(db);
        expect(allPublishers.length).toBe(3);
        expect(allPublishers.map(p => p.name)).toEqual(['Pub A', 'Pub M', 'Pub Z']);
    });
});
