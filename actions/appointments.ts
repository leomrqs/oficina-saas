// actions/appointments.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function createAppointment(data: { customerId: string, vehicleId?: string, orderId?: string, date: string, time: string, endTime?: string, notes?: string }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Não autorizado");

  await prisma.appointment.create({
    data: {
      customerId: data.customerId,
      vehicleId: data.vehicleId || null,
      orderId: data.orderId || null,
      date: new Date(`${data.date}T12:00:00Z`), // Força o meio-dia UTC para evitar bug de fuso
      time: data.time,
      endTime: data.endTime || null,
      notes: data.notes,
      tenantId: session.user.tenantId,
      // Se vinculou uma OS existente, nasce já como "OS Gerada"
      status: data.orderId ? "COMPLETED" : "SCHEDULED",
    }
  });

  revalidatePath("/dashboard/agendamentos");
}

export async function updateAppointmentStatus(id: string, status: "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELED" | "NO_SHOW") {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Não autorizado");

  await prisma.appointment.update({
    where: { id, tenantId: session.user.tenantId },
    data: { status }
  });

  revalidatePath("/dashboard/agendamentos");
}

export async function deleteAppointment(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Não autorizado");

  await prisma.appointment.delete({
    where: { id, tenantId: session.user.tenantId }
  });

  revalidatePath("/dashboard/agendamentos");
}

// 🪄 A MÁGICA: Transforma um Agendamento em OS
export async function generateOSFromAppointment(appointmentId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Não autorizado");
  const tenantId = session.user.tenantId;

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId, tenantId }
  });

  if (!appointment || !appointment.vehicleId) throw new Error("Agendamento inválido ou sem veículo.");

  // 1. Cria uma OS PENDING (Orçamento) usando os dados do Agendamento
  const order = await prisma.order.create({
    data: {
      customerId: appointment.customerId,
      vehicleId: appointment.vehicleId,
      problem: appointment.notes,
      status: "PENDING",
      tenantId: tenantId,
      history: {
        create: {
          newStatus: "PENDING",
          notes: "Orçamento gerado a partir de um Agendamento.",
          tenantId: tenantId
        }
      }
    }
  });

  // 2. Atualiza o agendamento marcando como Concluído e atrelando a OS gerada
  await prisma.appointment.update({
    where: { id: appointment.id },
    data: { 
      status: "COMPLETED",
      orderId: order.id 
    }
  });

  revalidatePath("/dashboard/agendamentos");
  revalidatePath("/dashboard/os");
  return order.id;
}