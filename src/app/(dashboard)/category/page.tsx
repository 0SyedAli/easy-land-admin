'use client';

import React, { useEffect, useMemo, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import {
    Alert,
    Snackbar,
    Button,
    Grid,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    TextField,
} from '@mui/material';
import api from '@/lib/api';

interface Category {
    _id: string;
    name: string;
    description: string;
}

const initialFormState = {
    name: '',
    description: '',
};

const CategorySkeleton = () => (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 flex flex-col justify-between animate-pulse">
        <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded-lg w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded-lg w-3/4"></div>
        </div>
        <div className="mt-6 flex gap-3">
            <div className="h-10 flex-1 bg-gray-200 rounded-2xl"></div>
            <div className="h-10 flex-1 bg-gray-200 rounded-2xl"></div>
        </div>
    </div>
);

export default function CategoryPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState(initialFormState);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await api.get('category');
            const categoriesData = response?.data?.categories ?? [];
            setCategories(categoriesData);
        } catch (err: any) {
            console.error('Failed to fetch categories:', err);
            setError(err?.response?.data?.message ?? 'Unable to load categories.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // useEffect(() => {
    //     if (success) {
    //         const timer = setTimeout(() => {
    //             setSuccess('');
    //         }, 2000);
    //         return () => clearTimeout(timer);
    //     }
    // }, [success]);

    const filteredCategories = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        if (!normalizedSearch) {
            return categories;
        }
        return categories.filter((category) => {
            return (
                category.name.toLowerCase().includes(normalizedSearch) ||
                category.description.toLowerCase().includes(normalizedSearch)
            );
        });
    }, [categories, searchTerm]);

    const openForm = (category?: Category) => {
        setError('');
        setSuccess('');
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                description: category.description || '',
            });
        } else {
            setEditingCategory(null);
            setFormData(initialFormState);
        }
        setFormOpen(true);
    };

    const closeForm = () => {
        setFormOpen(false);
        setEditingCategory(null);
        setFormData(initialFormState);
    };

    const handleDeleteDialogOpen = (category: Category) => {
        setDeleteCategory(category);
        setDeleteDialogOpen(true);
        setError('');
        setSuccess('');
    };

    const handleDeleteDialogClose = () => {
        setDeleteDialogOpen(false);
        setDeleteCategory(null);
    };

    const handleFormChange = (field: 'name' | 'description') => (event: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    };

    const handleSaveCategory = async () => {
        if (!formData.name.trim()) {
            setError('Category name is required.');
            return;
        }

        const payload = {
            name: formData.name.trim(),
            description: formData.description.trim(),
        };

        try {
            setSaving(true);
            setError('');
            const response = editingCategory
                ? await api.patch(`category/${editingCategory._id}`, payload)
                : await api.post('category', payload);

            const successMessage = editingCategory ? 'Category updated successfully.' : 'Category created successfully.';
            setSuccess(successMessage);
            setFormOpen(false);
            setEditingCategory(null);
            setFormData(initialFormState);
            await fetchCategories();
        } catch (err: any) {
            console.error('Failed to save category:', err);
            setError(err?.response?.data?.message ?? 'Unable to save category.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteCategory = async () => {
        if (!deleteCategory) {
            return;
        }

        try {
            setSaving(true);
            setError('');
            await api.delete(`category/${deleteCategory._id}`);
            setSuccess('Category deleted successfully.');
            handleDeleteDialogClose();
            await fetchCategories();
        } catch (err: any) {
            console.error('Failed to delete category:', err);
            setError(err?.response?.data?.message ?? 'Unable to delete category.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#f8fafc] min-h-screen">
            {/* {(error || success) && (
                <Snackbar
                    autoHideDuration={6000}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                    {error ? <Alert severity="error" onClose={() => setError('')}>{error}</Alert> : null}
                    {success ? <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert> : null}
                </Snackbar>
            )} */}
            <Snackbar
                open={Boolean(error || success)}
                autoHideDuration={2000}
                onClose={() => {
                    setError('');
                    setSuccess('');
                }}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                {error ? (
                    <Alert
                        severity="error"
                        onClose={() => setError('')}
                        sx={{ width: '100%' }}
                    >
                        {error}
                    </Alert>
                ) : (
                    <Alert
                        severity="success"
                        onClose={() => setSuccess('')}
                        sx={{ width: '100%' }}
                    >
                        {success}
                    </Alert>
                )}
            </Snackbar>
            <div className="flex flex-col gap-6 mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
                        <p className="text-gray-500">Create, update, and delete service categories.</p>
                    </div>
                    <Button
                        variant="contained"
                        color="success"
                        startIcon={<AddIcon />}
                        onClick={() => openForm()}
                        className="rounded-2xl bg-[#2f6f1f] hover:bg-[#255917] px-6 py-3"
                    >
                        New Category
                    </Button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                    <div className="relative flex-1">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Search categories..."
                            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2f6f1f]/20 focus:border-[#2f6f1f]"
                        />
                    </div>
                    {loading ? (
                        <div className="flex items-center gap-2 text-gray-600">
                            <CircularProgress size={20} />
                            Loading categories...
                        </div>
                    ) : null}
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
                {loading ? (
                    Array.from({ length: 6 }).map((_, index) => <CategorySkeleton key={index} />)
                ) : filteredCategories.length > 0 ? (
                    filteredCategories.map((category) => (
                        <div key={category._id} className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 flex flex-col justify-between">
                            <div>
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">{category.name}</h2>
                                        <p className="text-sm text-gray-500 mt-1">{category.description || 'No description provided.'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center gap-3">
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    startIcon={<EditIcon />}
                                    onClick={() => openForm(category)}
                                    className="rounded-2xl border-gray-200 text-gray-700 hover:bg-gray-50"
                                >
                                    Edit
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    startIcon={<DeleteIcon />}
                                    onClick={() => handleDeleteDialogOpen(category)}
                                    className="rounded-2xl border-gray-200 text-gray-700 hover:bg-gray-50"
                                >
                                    Delete
                                </Button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 col-span-full text-center text-gray-500">
                        No categories found.
                    </div>
                )}
            </div>

            <Dialog open={formOpen} onClose={closeForm} fullWidth maxWidth="sm">
                <DialogTitle className="flex items-center justify-between gap-4">
                    <span>{editingCategory ? 'Edit Category' : 'New Category'}</span>
                    <IconButton onClick={closeForm} size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ px: 3, py: 4, mt: 2 }}>
                    <Grid container spacing={2} className="mt-2">
                        <Grid size={{ xs: 12 }}>

                            <TextField
                                fullWidth
                                label="Category name"
                                value={formData.name}
                                onChange={handleFormChange('name')}
                                variant="outlined"
                                placeholder="Remodeling"
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>

                            <TextField
                                fullWidth
                                label="Description"
                                value={formData.description}
                                onChange={handleFormChange('description')}
                                variant="outlined"
                                placeholder="Optional description"
                                multiline
                                minRows={3}
                            />
                        </Grid>
                    </Grid>
                    {/* {error ? <Alert severity="error">{error}</Alert> : null} */}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3, pt: 0 }} className="justify-end">
                    <Button onClick={closeForm} color="inherit" disabled={saving}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="success"
                        onClick={handleSaveCategory}
                        disabled={saving}
                        className="rounded-2xl bg-[#2f6f1f] hover:bg-[#255917] px-6"
                    >
                        {saving ? <CircularProgress size={20} color="inherit" /> : editingCategory ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={deleteDialogOpen} onClose={handleDeleteDialogClose} fullWidth maxWidth="xs">
                <DialogTitle>Delete Category</DialogTitle>
                <DialogContent>
                    <p className="text-sm text-gray-600">Are you sure you want to delete <strong>{deleteCategory?.name}</strong>? This action cannot be undone.</p>
                    {error ? <Alert className="mt-4" severity="error">{error}</Alert> : null}
                </DialogContent>
                <DialogActions className="px-5 pb-5">
                    <Button onClick={handleDeleteDialogClose} disabled={saving}>Cancel</Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleDeleteCategory}
                        disabled={saving}
                        className="rounded-2xl px-6"
                    >
                        {saving ? <CircularProgress size={20} color="inherit" /> : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}
