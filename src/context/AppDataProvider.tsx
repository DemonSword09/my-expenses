import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CategoryRepo } from '../db/repositories/CategoryRepo';
import { PayeeRepo } from '../db/repositories/PayeeRepo';
import type { Category, Payee } from '../db/models';

interface AppDataContextType {
    categories: Category[];
    payees: Payee[];
    categoriesMap: Record<string, string>; // id -> label
    payeesMap: Record<string, string>; // id -> name
    loading: boolean;
    refreshData: () => Promise<void>;
    getCategoryLabel: (id: string | null | undefined) => string;
    getPayeeName: (id: string | null | undefined) => string;
}

const AppDataContext = createContext<AppDataContextType>({
    categories: [],
    payees: [],
    categoriesMap: {},
    payeesMap: {},
    loading: true,
    refreshData: async () => { },
    getCategoryLabel: () => '',
    getPayeeName: () => '',
});

export const useAppData = () => useContext(AppDataContext);

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [payees, setPayees] = useState<Payee[]>([]);
    const [categoriesMap, setCategoriesMap] = useState<Record<string, string>>({});
    const [payeesMap, setPayeesMap] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        try {
            // Load Categories
            const cats = await CategoryRepo.listAll();
            setCategories(cats);

            // Build Category Map
            const cMap: Record<string, string> = {};
            const idToLabel: Record<string, string> = {};

            // First pass: Direct labels
            cats.forEach((c) => {
                idToLabel[c.id] = c.label;
            });

            // Second pass: Hierarchy for map
            cats.forEach((c) => {
                if (c.parentId && idToLabel[c.parentId]) {
                    cMap[c.id] = `${idToLabel[c.parentId]} > ${c.label}`;
                } else {
                    cMap[c.id] = c.label;
                }
            });
            setCategoriesMap(cMap);

            // Load Payees via Repo
            const payeeRows = await PayeeRepo.listAll();
            setPayees(payeeRows);

            const pMap: Record<string, string> = {};
            payeeRows.forEach((p) => {
                pMap[p.id] = p.name;
            });
            setPayeesMap(pMap);

        } catch (e) {
            console.error('AppDataProvider: Failed to load data', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const getCategoryLabel = useCallback((id: string | null | undefined) => {
        if (!id) return '';
        return categoriesMap[id] || 'Unknown Category';
    }, [categoriesMap]);

    const getPayeeName = useCallback((id: string | null | undefined) => {
        if (!id) return '';
        return payeesMap[id] || 'Unknown Payee';
    }, [payeesMap]);

    const value = {
        categories,
        payees,
        categoriesMap,
        payeesMap,
        loading,
        refreshData: loadData,
        getCategoryLabel,
        getPayeeName,
    };

    return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};
