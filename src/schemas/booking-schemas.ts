
import { BookingBody } from "@/protocols";
import Joi from "joi";

export const bookingSchema = Joi.object<BookingBody>({
    roomId: Joi.number().required()
})