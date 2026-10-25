-- Migration: Make product price nullable
-- Date: 2026-08-31
-- Adds NULL support to products.price

ALTER TABLE public.products ALTER COLUMN price DROP NOT NULL;
