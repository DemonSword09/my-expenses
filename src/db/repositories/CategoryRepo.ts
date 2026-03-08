// src/db/repositories/CategoryRepo.ts
import { all, first, run } from '../sqlite';
import type { Category } from '../models';
import { uuidSync } from '../../utils/uuid';

export const CategoryRepo = {
  async listHierarchy(): Promise<(Category & { children: Category[] })[]> {
    const allCats = await this.listAll();
    const map = new Map<string, Category & { children: Category[] }>();

    // 1. Create nodes
    allCats.forEach(c => {
      map.set(c.id, { ...c, children: [] });
    });

    const roots: (Category & { children: Category[] })[] = [];

    // 2. Build tree
    allCats.forEach(c => {
      const node = map.get(c.id)!;
      if (c.parentId && map.has(c.parentId)) {
        map.get(c.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  },

  async create(payload: Partial<Category> & { parentId?: string | null }): Promise<Category> {
    const id = payload.id ?? uuidSync();
    await run(
      `INSERT INTO categories (id, label, parentId, icon, color)
       VALUES (?, ?, ?, ?, ?)`,
      [
        id,
        payload.label ?? 'Unnamed',
        payload.parentId ?? null,
        payload.icon ?? null,
        payload.color ?? null,
      ],
    );
    return {
      id,
      label: payload.label ?? 'Unnamed',
      parentId: payload.parentId ?? null,
      icon: payload.icon ?? null,
      color: payload.color ?? null,
    } as Category;
  },

  async listAll(): Promise<Category[]> {
    const rows = await all<any>('SELECT * FROM categories ORDER BY label COLLATE NOCASE ASC');
    return rows.map((r: any) => ({
      id: r.id,
      label: r.label,
      parentId: r.parentId ?? null,
      icon: r.icon ?? null,
      color: r.color ?? null,
    })) as Category[];
  },

  async listByParent(parentId: string | null): Promise<Category[]> {
    if (parentId === null) {
      const rows = await all<any>(
        'SELECT * FROM categories WHERE parentId IS NULL ORDER BY label COLLATE NOCASE ASC',
      );
      return rows.map((r: any) => ({
        id: r.id,
        label: r.label,
        parentId: r.parentId ?? null,
        icon: r.icon ?? null,
        color: r.color ?? null,
      })) as Category[];
    } else {
      const rows = await all<any>(
        'SELECT * FROM categories WHERE parentId = ? ORDER BY label COLLATE NOCASE ASC',
        [parentId],
      );
      return rows.map((r: any) => ({
        id: r.id,
        label: r.label,
        parentId: r.parentId ?? null,
        icon: r.icon ?? null,
        color: r.color ?? null,
      })) as Category[];
    }
  },

  async findById(id: string): Promise<Category | null> {
    const r = await first<any>('SELECT * FROM categories WHERE id = ? LIMIT 1', [id]);
    if (!r) return null;
    return {
      id: r.id,
      label: r.label,
      parentId: r.parentId ?? null,
      icon: r.icon ?? null,
      color: r.color ?? null,
    } as Category;
  },

  async update(id: string, payload: Partial<Category>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (payload.label !== undefined) {
      fields.push('label = ?');
      values.push(payload.label);
    }
    if (payload.icon !== undefined) {
      fields.push('icon = ?');
      values.push(payload.icon);
    }
    if (payload.color !== undefined) {
      fields.push('color = ?');
      values.push(payload.color);
    }
    if (payload.parentId !== undefined) {
      fields.push('parentId = ?');
      values.push(payload.parentId);
    }

    if (fields.length === 0) return;

    values.push(id);
    await run(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, values);
  },

  async delete(id: string): Promise<void> {
    // 1. Unlink transactions (set categoryId = null)
    await run('UPDATE transactions SET categoryId = NULL, updatedAt = ? WHERE categoryId = ?', [Date.now(), id]);

    // 2. Handle subcategories - for now, let's delete them too or unlink them?
    // Usually deleting a category deletes subcategories or moves them to root.
    // Let's delete them for simplicity as per requirement "delete".
    // But first unlink transactions for subcategories
    const children = await this.listByParent(id);
    for (const child of children) {
      await run('UPDATE transactions SET categoryId = NULL, updatedAt = ? WHERE categoryId = ?', [Date.now(), child.id]);
      await run('DELETE FROM categories WHERE id = ?', [child.id]);
    }

    // 3. Delete the category
    await run('DELETE FROM categories WHERE id = ?', [id]);
  },
};
