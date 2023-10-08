import faker from '@faker-js/faker';
import { TicketStatus } from '@prisma/client';
import { prisma } from '@/config';

export async function createTicketType(isRemote?: boolean, includesHotel?: boolean) {
  return prisma.ticketType.create({
    data: {
      name: faker.name.findName(),
      price: faker.datatype.number(),
      isRemote: isRemote !== undefined ? isRemote : faker.datatype.boolean(),
      includesHotel: includesHotel !== undefined ? includesHotel : faker.datatype.boolean(),
    },
  });
}



export async function createTicket(enrollmentId: number, ticketTypeId: number, status: TicketStatus) {
  const ticketType = await prisma.ticketType.findUnique({
    where: { id: ticketTypeId },
  });

  if (!ticketType) {
    throw new Error(`TicketType with ID ${ticketTypeId} not found.`);
  }

  
  return prisma.ticket.create({
    data: {
      enrollmentId: enrollmentId,
      ticketTypeId: ticketTypeId,
      status: status,
    },
  });
}
