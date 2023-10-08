import {
    User,
    Enrollment,
    Hotel,
    Room,
    Booking,
    Ticket,
    TicketStatus,
    TicketType,
  } from '@prisma/client';

  import {
    createBooking,
    createEnrollmentWithAddress,
    createHotel,
    createRoomWithHotelId,
    createUser,
    createTicket,
    createTicketHotel,
    createPayment,
  } from '../factories';
  import { cleanDb } from '../helpers';
  import { init } from '@/app';
  import { bookingService } from '@/services';
  import { ticketsRepository } from '@/repositories';
  import { bookingRepository } from '@/repositories/booking-repository';
  import { TicketTypeTicket } from '@/protocols';
import faker from '@faker-js/faker';
  
  beforeAll(async () => {
    await init();
  });
  
  beforeEach(async () => {
    await cleanDb();
  });
  
  const createMockUser = async (): Promise<User> => {
    return await createUser();
  };
  
  const createMockEnrollment = async (user: User): Promise<Enrollment> => {
    return await createEnrollmentWithAddress(user);
  };
  
  const createMockTicketType = async (): Promise<TicketType> => {
    return await createTicketHotel();
  };
  
  const createMockTicket = async (
    enrollmentId: number,
    ticketTypeId: number,
    status: TicketStatus
  ): Promise<Ticket> => {
    const mockTicketType = await createMockTicketType();
    const ticket = await createTicket(enrollmentId, ticketTypeId, status);
    await createPayment(ticket.id, mockTicketType.price);
  
    return ticket;
  };
  
  const createMockHotelAndRoom = async (): Promise<[Hotel, Room]> => {
    const hotel = await createHotel();
    const room = await createRoomWithHotelId(hotel.id);
    return [hotel, room];
  };
  
  describe('All unit tests', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    it.each([
      {
        testName: 'ticketType is remote',
        ticketStatus: TicketStatus.PAID,
        includesHotel: true,
        expectedError: 'ForbiddenError',
      },
      {
        testName: 'ticketType is not PAID',
        ticketStatus: TicketStatus.RESERVED,
        includesHotel: true,
        expectedError: 'ForbiddenError',
      },
      {
        testName: 'ticketType does not include hotel',
        ticketStatus: TicketStatus.PAID,
        includesHotel: false,
        expectedError: 'ForbiddenError',
      },
    ])('should throw an error when %s', async ({ ticketStatus, includesHotel, expectedError }) => {
      const mockUser = await createMockUser();
      const mockEnrollment = await createMockEnrollment(mockUser);
      const mockTicket = await createMockTicket(mockEnrollment.id, 1, ticketStatus);
      const [mockHotel, mockRoom] = await createMockHotelAndRoom();
      const mockBooking = await createBooking(mockUser.id, mockRoom.id);
  
      const ticket: TicketTypeTicket = {
        id: mockBooking.id,
        ticketTypeId: 1,
        enrollmentId: mockEnrollment.id,
        status: ticketStatus,
        TicketType: {
          id: 1,
          name: faker.name.findName(),
          price: faker.datatype.number(),
          isRemote: true,
          includesHotel,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
  
      jest.spyOn(ticketsRepository, 'findTicketByEnrollmentId').mockResolvedValue(ticket);
  
      try {
        await bookingService.createBooking(mockBooking.roomId, mockUser.id);
        fail(`Expected createBooking to throw ${expectedError}`);
      } catch (error) {
        expect(error.name).toEqual(expectedError);
        expect(error.message).toEqual('You do not have permission to access this resource.');
      }
    });
  
    it('should throw an error when room to update does not belong to the user', async () => {
      const mockUser = await createMockUser();
      const [mockHotel, mockRoom] = await createMockHotelAndRoom();
      const mockBooking = await createBooking(mockUser.id, mockRoom.id);
  
      jest.spyOn(bookingRepository, 'getBooking').mockResolvedValue(null);
  
      try {
        await bookingService.updateBooking(mockBooking.roomId, mockUser.id, mockBooking.id);
        fail('Expected updateBooking to throw ForbiddenError');
      } catch (error) {
        expect(error.name).toEqual('ForbiddenError');
        expect(error.message).toEqual('You do not have permission to access this resource.');
      }
    });
  });
  