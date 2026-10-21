import { z } from 'zod';

export enum UserRole {
  ADMIN = 'admin',               // Escritório / Chefia de Housekeeping
  SUPERVISOR = 'supervisor',     // Governanta de serviço
  HOUSEKEEPER = 'housekeeper',   // Empregada de andares / Responsável de área
  RECEPTION = 'reception'        // Receção do hotel
}

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email ou identificador é obrigatório')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(4, 'Password deve ter no mínimo 4 caracteres'),
  areaBlock: z.string().optional(),
  rememberMe: z.boolean().optional()
});

export type LoginFormData = z.infer<typeof loginSchema>;

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  assignedArea?: string; // Bloco atualmente atribuído: "Bloco A", "Bloco B", etc.
  defaultBlock?: string;  // Bloco fixo por default ("Bloco A", "Bloco B", "Bloco C", "Bloco D", "Oasis Parc", "Master Villas", "Apoio & Rotativas")
  isOnDuty?: boolean;     // De serviço hoje (true) ou folga/ausente (false)
  shift?: string;         // "Manhã" | "Tarde 13h30" | "Turndown" | "Geral"
  notes?: string;
  assignedSheetId?: string;
  avatar?: string;
  isExtra?: boolean;
  phoneDeviceId?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}
