import { prueba } from "@/actions/prueba";
import Image from "next/image";

export default async function Home() {
  const pruebas = await prueba();
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      {
        pruebas.map((prueba: { id: string; created_at: Date; nombres: string; }) => (
          <div key={prueba.id} className="flex flex-col items-center justify-center">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{prueba.nombres}</h1>
            <p className="text-gray-600 dark:text-gray-400">{prueba.created_at.toLocaleDateString()}</p>
          </div>
        ))
      }
    </div>
  );
}
