import { notFoundError } from "@/errors";
import { forbiddenError } from "@/errors/forbidden-error";
import { enrollmentRepository, ticketsRepository } from "@/repositories";
import { bookingRepository } from "@/repositories/booking-repository";
import { TicketStatus } from "@prisma/client";

async function validateEnrollment(userId: number) {
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
  if (!enrollment) throw forbiddenError();

  const ticket = await ticketsRepository.findTicketByEnrollmentId(enrollment.id);
  if (
    ticket.TicketType.isRemote === true ||
    ticket.TicketType.includesHotel === false ||
    ticket.status === TicketStatus.RESERVED
  ) {
    throw forbiddenError();
  }
}

async function checkRoomAvailability(roomId: number) {
  const findRoomId = await bookingRepository.findRoomId(roomId);
  if (!findRoomId) throw notFoundError();

  const fullRoom = await bookingRepository.findBookingByRoomId(roomId);
  if (fullRoom) throw forbiddenError();
}

async function getBooking(userId: number) {
  const response = await bookingRepository.getBooking(userId);

  if (!response) throw notFoundError();

  const correctInfoBooking = {
    id: response.id,
    Room: response.Room,
  };

  return correctInfoBooking;
}

async function createBooking(roomId: number, userId: number) {
  await validateEnrollment(userId);
  await checkRoomAvailability(roomId);

  const response = await bookingRepository.createBooking(roomId, userId);

  return { bookingId: response.id };
}

async function updateBooking(roomId: number, userId: number, bookingId: number) {
  await validateEnrollment(userId);
  await checkRoomAvailability(roomId);

  const existingBooking = await bookingRepository.getBooking(userId);
  if (!existingBooking) throw forbiddenError();

  const response = await bookingRepository.updateBooking(userId, roomId, bookingId);

  return { bookingId: response.id };
}

export const bookingService = { getBooking, createBooking, updateBooking };
