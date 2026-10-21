import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/config/constants';
import { useAuth } from '@/hooks/auth/useAuth';
import { useStaff } from '@/hooks/staff';
import { loginSchema, type LoginFormData } from '@/types/auth.types';
import { PageLoading } from '@/UI/components/feedback/PageStates';
import { DemoAccounts } from './components/DemoAccounts';

const inputClass =
  'w-full rounded-[12px] border border-line bg-surface px-4 py-3 text-sm text-content placeholder:text-muted transition-colors duration-500 focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary';

// - Split-screen (Theme.txt): painel de marca só a partir de lg; abaixo, página inteira só com o formulário
export const LoginPage = () => {
  const { t } = useTranslation();
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: staff = [] } = useStaff();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });

  const destination = (location.state as { from?: string } | null)?.from ?? ROUTES.PLANNING;

  if (loading) return <PageLoading />;
  if (isAuthenticated) return <Navigate to={destination} replace />;

  const onSubmit = handleSubmit(async values => {
    setSubmitError(null);
    try {
      await login(values);
      navigate(destination, { replace: true });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'login.errors.generic');
    }
  });

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-canvas text-content">
      <aside className="hidden lg:flex flex-col justify-between bg-primary p-12 text-primary-foreground">
        <span className="text-lg font-semibold tracking-tight">{t('app.hotelName')}</span>
        <div className="space-y-4 max-w-md">
          <h1 className="text-4xl font-semibold tracking-tight">{t('app.productName')}</h1>
          <p className="text-lg opacity-90">{t('login.tagline')}</p>
        </div>
        <span className="text-xs opacity-80">{t('login.footer')}</span>
      </aside>

      <main className="flex flex-col justify-between p-6 sm:p-12 lg:justify-center">
        <span className="lg:hidden text-lg font-semibold tracking-tight text-content">{t('app.hotelName')} · {t('app.productName')}</span>

        <form onSubmit={onSubmit} noValidate className="w-full max-w-sm mx-auto space-y-6 my-8">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">{t('login.title')}</h2>
            <p className="text-sm text-muted">{t('login.subtitle')}</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">{t('login.email')}</label>
            <input id="email" type="text" autoComplete="username" aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-error' : undefined} className={inputClass} {...register('email')} />
            {errors.email?.message && <p id="email-error" role="alert" className="text-xs text-danger">{t(errors.email.message)}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">{t('login.password')}</label>
            <input id="password" type="password" autoComplete="current-password" aria-invalid={!!errors.password} aria-describedby={errors.password ? 'password-error' : undefined} className={inputClass} {...register('password')} />
            {errors.password?.message && <p id="password-error" role="alert" className="text-xs text-danger">{t(errors.password.message)}</p>}
          </div>

          {submitError && <p role="alert" className="text-sm text-danger">{t(submitError)}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-[12px] bg-primary hover:bg-primary-hover text-primary-foreground px-6 py-3 text-sm font-medium transition-all duration-300 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:opacity-60"
          >
            {isSubmitting ? t('login.submitting') : t('login.submit')}
          </button>

          <DemoAccounts
            users={staff}
            onPick={user => {
              setValue('email', user.email, { shouldValidate: true });
              setValue('password', t('login.demoPassword'), { shouldValidate: true });
            }}
          />
        </form>

        <span className="lg:hidden text-xs text-muted text-center">{t('login.footer')}</span>
      </main>
    </div>
  );
};
