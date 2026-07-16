import { eq, asc, and } from 'drizzle-orm';
import type { Database } from './db';
import { games, categories, publishers } from '../../db/schema';
import type { Game } from '../types/game';
import type { CategoryRow, PublisherRow } from '../../db/schema';

const gameSelection = {
    id: games.id,
    title: games.title,
    description: games.description,
    starRating: games.starRating,
    categoryId: categories.id,
    categoryName: categories.name,
    publisherId: publishers.id,
    publisherName: publishers.name,
};

type GameSelectionRow = {
    id: number;
    title: string;
    description: string;
    starRating: number | null;
    categoryId: number | null;
    categoryName: string | null;
    publisherId: number | null;
    publisherName: string | null;
};

function mapGame(row: GameSelectionRow): Game {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        starRating: row.starRating,
        category:
            row.categoryId !== null && row.categoryName !== null
                ? { id: row.categoryId, name: row.categoryName }
                : null,
        publisher:
            row.publisherId !== null && row.publisherName !== null
                ? { id: row.publisherId, name: row.publisherName }
                : null,
    };
}

function baseGamesQuery(db: Database) {
    return db
        .select(gameSelection)
        .from(games)
        .leftJoin(categories, eq(games.categoryId, categories.id))
        .leftJoin(publishers, eq(games.publisherId, publishers.id));
}

function filterGamesByCategoryAndPublisher(
    db: Database,
    categoryId: number | null = null,
    publisherId: number | null = null
) {
    let query = baseGamesQuery(db);
    
    if (categoryId !== null) {
        query = query.where(eq(games.categoryId, categoryId));
    }
    if (publisherId !== null) {
        query = query.where(eq(games.publisherId, publisherId));
    }
    
    return query.orderBy(asc(games.title));
}

/** All games ordered by title. */
export async function getAllGames(db: Database): Promise<Game[]> {
    const rows = await baseGamesQuery(db).orderBy(asc(games.title));
    return rows.map(mapGame);
}

/** All game ids ordered by title. */
export async function getAllGameIds(db: Database): Promise<number[]> {
    const rows = await db.select({ id: games.id }).from(games).orderBy(asc(games.title));
    return rows.map((row) => row.id);
}

/** A single game by id, or null when it does not exist. */
export async function getGameById(db: Database, id: number): Promise<Game | null> {
    const rows = await baseGamesQuery(db).where(eq(games.id, id)).limit(1);
    return rows.length > 0 ? mapGame(rows[0]) : null;
}

/** All categories ordered by name. */
export async function getAllCategories(db: Database): Promise<CategoryRow[]> {
    const rows = await db.select().from(categories).orderBy(asc(categories.name));
    return rows;
}

/** All publishers ordered by name. */
export async function getAllPublishers(db: Database): Promise<PublisherRow[]> {
    const rows = await db.select().from(publishers).orderBy(asc(publishers.name));
    return rows;
}

/** Games filtered by category ID, ordered by title. */
export async function getGamesByCategory(db: Database, categoryId: number): Promise<Game[]> {
    const rows = await filterGamesByCategoryAndPublisher(db, categoryId, null);
    return rows.map(mapGame);
}

/** Games filtered by publisher ID, ordered by title. */
export async function getGamesByPublisher(db: Database, publisherId: number): Promise<Game[]> {
    const rows = await filterGamesByCategoryAndPublisher(db, null, publisherId);
    return rows.map(mapGame);
}

/** Games filtered by category ID and publisher ID, ordered by title. */
export async function getGamesByCategoryAndPublisher(
    db: Database,
    categoryId: number,
    publisherId: number
): Promise<Game[]> {
    const rows = await filterGamesByCategoryAndPublisher(db, categoryId, publisherId);
    return rows.map(mapGame);
}
