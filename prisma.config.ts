// prisma.config.ts
import { defineConfig } from '@prisma/config';
import { config } from 'dotenv';

// ISSO AQUI FORÇA A LEITURA DO .ENV NA MESMA HORA
config();

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});