-- Auto-seed default categories when a new profile is created
create or replace function public.seed_default_categories()
returns trigger as $$
begin
  insert into public.categories (user_id, name, icon, type, is_default, sort_order) values
    -- Expense categories
    (new.id, 'Food & Dining', '🍔', 'expense', true, 1),
    (new.id, 'Transport', '🚗', 'expense', true, 2),
    (new.id, 'SaaS Tools & Subscriptions', '💻', 'expense', true, 3),
    (new.id, 'Business Expenses', '💼', 'expense', true, 4),
    (new.id, 'Housing & Rent', '🏠', 'expense', true, 5),
    (new.id, 'Utilities & Bills', '⚡', 'expense', true, 6),
    (new.id, 'Entertainment', '🎬', 'expense', true, 7),
    (new.id, 'Health & Fitness', '💪', 'expense', true, 8),
    (new.id, 'Education & Learning', '📚', 'expense', true, 9),
    (new.id, 'Personal & Shopping', '🛍️', 'expense', true, 10),
    (new.id, 'Savings & Investments', '📈', 'expense', true, 11),
    (new.id, 'Gifts & Donations', '🎁', 'expense', true, 12),
    (new.id, 'Travel', '✈️', 'expense', true, 13),
    (new.id, 'Other', '📦', 'expense', true, 14),
    -- Income categories
    (new.id, 'Client Work / Freelance', '👨‍💻', 'income', true, 1),
    (new.id, 'Product Sales', '📱', 'income', true, 2),
    (new.id, 'Community / Course Revenue', '🎓', 'income', true, 3),
    (new.id, 'Ad Revenue', '📺', 'income', true, 4),
    (new.id, 'Affiliate Income', '🔗', 'income', true, 5),
    (new.id, 'Other Income', '💰', 'income', true, 6);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_profile_created_seed_categories
  after insert on public.profiles
  for each row execute function public.seed_default_categories();
