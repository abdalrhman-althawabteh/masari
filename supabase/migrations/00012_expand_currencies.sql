-- Expand supported currencies to include all Arab/Middle Eastern + major world currencies

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_default_currency_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_default_currency_check CHECK (default_currency IN ('USD','JOD','EUR','GBP','SAR','AED','EGP','TRY','IQD','KWD','BHD','OMR','QAR','LBP','SYP','YER','MAD','TND','DZD','LYD','SDG'));

ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_currency_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_currency_check CHECK (currency IN ('USD','JOD','EUR','GBP','SAR','AED','EGP','TRY','IQD','KWD','BHD','OMR','QAR','LBP','SYP','YER','MAD','TND','DZD','LYD','SDG'));

ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_currency_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_currency_check CHECK (currency IN ('USD','JOD','EUR','GBP','SAR','AED','EGP','TRY','IQD','KWD','BHD','OMR','QAR','LBP','SYP','YER','MAD','TND','DZD','LYD','SDG'));

ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_currency_check;
ALTER TABLE budgets ADD CONSTRAINT budgets_currency_check CHECK (currency IN ('USD','JOD','EUR','GBP','SAR','AED','EGP','TRY','IQD','KWD','BHD','OMR','QAR','LBP','SYP','YER','MAD','TND','DZD','LYD','SDG'));

ALTER TABLE savings_goals DROP CONSTRAINT IF EXISTS savings_goals_target_currency_check;
ALTER TABLE savings_goals ADD CONSTRAINT savings_goals_target_currency_check CHECK (target_currency IN ('USD','JOD','EUR','GBP','SAR','AED','EGP','TRY','IQD','KWD','BHD','OMR','QAR','LBP','SYP','YER','MAD','TND','DZD','LYD','SDG'));

ALTER TABLE savings_contributions DROP CONSTRAINT IF EXISTS savings_contributions_currency_check;
ALTER TABLE savings_contributions ADD CONSTRAINT savings_contributions_currency_check CHECK (currency IN ('USD','JOD','EUR','GBP','SAR','AED','EGP','TRY','IQD','KWD','BHD','OMR','QAR','LBP','SYP','YER','MAD','TND','DZD','LYD','SDG'));

ALTER TABLE debts DROP CONSTRAINT IF EXISTS debts_currency_check;
ALTER TABLE debts ADD CONSTRAINT debts_currency_check CHECK (currency IN ('USD','JOD','EUR','GBP','SAR','AED','EGP','TRY','IQD','KWD','BHD','OMR','QAR','LBP','SYP','YER','MAD','TND','DZD','LYD','SDG'));
