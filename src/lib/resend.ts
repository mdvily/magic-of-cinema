import { Resend } from "resend";

export const resend = new Resend(import.meta.env.RESEND_API_KEY);
export const FROM = "MovieMan <newsletter@magic-of-cinema.com>";
export const SITE = "https://magic-of-cinema.com";
