import FormReservation from "@/components/FormReservation";

export default function Page() {
  return (
    <div className="w-full min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans pt-15 px-6">
      <main className="max-w-3xl mx-auto flex flex-col gap-6">

        <div className="text-center">
          <h1 className="text-3xl font-bold">
            Prise de rendez-vous pour Livraison Transporteur
          </h1>

          <div className="mt-2 pt-5">
            <p className="text-gray-600 dark:text-gray-300">
              Merci de renseigner les informations ci-dessous afin de planifier votre livraison.
            </p>
          </div>
        </div>
          
        <div className="pt-7">
          <FormReservation />
        </div>
      </main>
    </div>
  );
}

