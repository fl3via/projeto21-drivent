import { BookingBody } from '@/protocols';
import httpStatus from 'http-status';
import { Response } from 'express';
import { AuthenticatedRequest } from '@/middlewares';
import { bookingService } from '@/services/booking-services';


async function handleBookingRequest(
  req: AuthenticatedRequest,
  res: Response,
  action: (req: AuthenticatedRequest) => Promise<any>
) {
  const { userId } = req;
  try {
    const result = await action(req);
    return res.status(httpStatus.OK).send(result);
  } catch (error) {
    if (error.name === 'NotFoundError') {
      return res.sendStatus(httpStatus.NOT_FOUND);
    }
    return res.sendStatus(httpStatus.FORBIDDEN);
  }
}

export async function getBooking(req: AuthenticatedRequest, res: Response) {
  return handleBookingRequest(req, res, () => bookingService.getBooking(req.userId));
}

export async function createBooking(req: AuthenticatedRequest, res: Response) {
  const { roomId } = req.body as BookingBody;
  return handleBookingRequest(req, res, () => bookingService.createBooking(roomId, req.userId));
}

export async function updateBooking(req: AuthenticatedRequest, res: Response) {
  const { roomId } = req.body as BookingBody;
  const { bookingId } = req.params;
  return handleBookingRequest(req, res, () =>
    bookingService.updateBooking(roomId, req.userId, Number(bookingId))
  );
}
