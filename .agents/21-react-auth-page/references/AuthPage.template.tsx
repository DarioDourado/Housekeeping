import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({ email: z.email(), password: z.string().min(1) });
export type LoginInput = z.infer<typeof schema>;
type Props = { login: (input: LoginInput) => Promise<void>; t: (key: string) => string };

export function AuthPage({ login, t }: Props) {
  const [failed, setFailed] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(schema),
  });
  return <main className="mx-auto max-w-md p-6">
    <h1>{t('auth.login')}</h1>
    <form noValidate onSubmit={handleSubmit(async (values) => {
      setFailed(false);
      try { await login(values); } catch { setFailed(true); }
    })}>
      <label htmlFor="auth-email">{t('auth.email')}</label>
      <input id="auth-email" type="email" autoComplete="username" {...register('email')}
        aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-error' : undefined} />
      {errors.email && <p id="email-error" role="alert">{t('validation.email')}</p>}
      <label htmlFor="auth-password">{t('auth.password')}</label>
      <input id="auth-password" type="password" autoComplete="current-password" {...register('password')}
        aria-invalid={!!errors.password} aria-describedby={errors.password ? 'password-error' : undefined} />
      {errors.password && <p id="password-error" role="alert">{t('validation.required')}</p>}
      {failed && <p role="alert">{t('auth.failed')}</p>}
      <button type="submit" disabled={isSubmitting}>{t(isSubmitting ? 'common.loading' : 'auth.login')}</button>
    </form>
  </main>;
}
