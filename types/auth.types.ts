import { z } from 'zod';

export enum UserRole {
  ADMIN = 'admin',               // Escritório / Chefia: inclui as governantas e os responsáveis de andares
  HOUSEKEEPER = 'housekeeper',   // Empregada de andares / Responsável de área
  RECEPTION = 'reception'        // Receção do hotel
}

// - Função (cargo) de quem é admin: a governanta responde pelas sheets e o responsável de andares pelos blocos.
//   Uma pessoa pode ter as duas. As permissões vêm do perfil (UserRole), não da função.
export enum JobTitle {
  GOVERNANTA = 'GOVERNANTA',
  FLOOR_MANAGER = 'RESPONSAVEL_ANDARES'
}

// - mensagens são chaves i18n; o formulário traduz (nunca texto fixo no schema)
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, 'login.errors.emailRequired'),
  password: z.string().min(4, 'login.errors.passwordMin'),
  rememberMe: z.boolean().optional()
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(UserRole),
  jobTitles: z.array(z.enum(JobTitle)).optional(),   // funções: governanta (sheets) e/ou responsável de andares (blocos)
  assignedArea: z.string().optional(),   // bloco atualmente atribuído: "Bloco A", "Bloco B", etc.
  defaultBlock: z.string().optional(),   // bloco fixo por defeito (ver BLOCK em config/constants)
  isOnDuty: z.boolean().optional(),      // de serviço hoje (true) ou folga/ausente (false)
  shift: z.string().optional(),          // "Manhã" | "Tarde 13h30" | "Turndown" | "Geral"
  notes: z.string().optional(),
  avatar: z.string().optional(),
  isExtra: z.boolean().optional(),
  phoneDeviceId: z.string().optional()
});

export type User = z.infer<typeof userSchema>;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}
