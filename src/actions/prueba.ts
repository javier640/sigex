"use server";

import {db} from "@/lib/db";
export const prueba = async () => {
    const prueba = await db.prueba.findMany();
    return prueba;
}
