// API Configuration
// This file centralizes the API URL configuration for the entire application
// It uses environment variables for deployment and falls back to localhost for development

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';