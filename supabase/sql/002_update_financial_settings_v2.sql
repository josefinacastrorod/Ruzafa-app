-- Ruzafa App - Financial settings V2
-- Nueva lógica:
-- 1) Ganancia mensual - monto fijo
-- 2) Al restante se aplica % retiro y % ahorros

alter table public.financial_settings
  add column if not exists savings_percentage numeric(5, 2);

update public.financial_settings
set savings_percentage = coalesce(cushion_percentage, 0)
where savings_percentage is null;

update public.financial_settings
set fixed_amount_to_keep = 0
where fixed_amount_to_keep is null;

update public.financial_settings
set withdrawal_percentage = 0
where withdrawal_percentage is null;

alter table public.financial_settings
  alter column fixed_amount_to_keep set not null,
  alter column withdrawal_percentage set not null,
  alter column savings_percentage set not null;

alter table public.financial_settings
  drop constraint if exists financial_settings_mode_check;

alter table public.financial_settings
  drop constraint if exists financial_settings_fixed_amount_to_keep_check,
  drop constraint if exists financial_settings_withdrawal_percentage_check,
  drop constraint if exists financial_settings_cushion_percentage_check,
  drop constraint if exists financial_settings_reinvestment_percentage_check,
  drop constraint if exists financial_settings_percentage_to_keep_check;

alter table public.financial_settings
  drop column if exists save_rule_type,
  drop column if exists percentage_to_keep,
  drop column if exists cushion_percentage,
  drop column if exists reinvestment_percentage;

alter table public.financial_settings
  add constraint financial_settings_fixed_amount_to_keep_check
    check (fixed_amount_to_keep >= 0),
  add constraint financial_settings_withdrawal_percentage_check
    check (withdrawal_percentage >= 0 and withdrawal_percentage <= 100),
  add constraint financial_settings_savings_percentage_check
    check (savings_percentage >= 0 and savings_percentage <= 100);

drop type if exists public.save_rule_type;
