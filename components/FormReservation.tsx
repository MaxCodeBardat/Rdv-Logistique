"use client";

import { useState, useRef, useEffect } from "react";
import { v4 as uuid } from "uuid";
import { Trash2 } from "lucide-react";
import { Plus } from "lucide-react";

type Supplier = {
  id: string;
  name: string;
  pallets: number;
};

export default function FormReservation() {
  const [step, setStep] = useState(1); // 1 = infos générales, 2 = fournisseurs
  const [orderNumber, setOrderNumber] = useState("");
  const [totalPallets, setTotalPallets] = useState<number | "">("");
  const [email, setEmail] = useState("");
  const [suppliers, setSuppliers] = useState<Supplier[]>([
    { id: uuid(), name: "", pallets: 0 },
  ]);
  const supplierNameRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [shake, setShake] = useState(false);

  const [errorsStep1, setErrorsStep1] = useState({
    orderNumber: false,
    totalPallets: false,
    email: false,
  });
  const [showErrorMessage, setShowErrorMessage] = useState(false);

   useEffect(() => {
    setErrorsStep1({ orderNumber: false, totalPallets: false, email: false });
    setShowErrorMessage(false);
    setShake(false);
  }, [step]);

  const goToStep2 = () => {
    // validation step1 fields
    const newErrors = {
      orderNumber: orderNumber.trim() === "",
      totalPallets: totalPallets === "" || totalPallets === 0,
      email: email.trim() === "",
    };
    setErrorsStep1(newErrors);
    const hasError = Object.values(newErrors).some(Boolean);

    if (hasError) {
      setShowErrorMessage(true);
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }

    setShowErrorMessage(false);

    // Validation fournisseurs pour step1 → uniquement noms
    validateSuppliers(true);

    setStep(2);
  };

  const [errorsSuppliers, setErrorsSuppliers] = useState<Record<string, { name: boolean; pallets: boolean }>>({});
  const [showSupplierError, setShowSupplierError] = useState(false);
  const validateSuppliers = (isStep1: boolean = false) => {
    const newErrors: Record<string, { name: boolean; pallets: boolean }> = {};

    suppliers.forEach(supplier => {
      newErrors[supplier.id] = {
        name: supplier.name.trim() === "",
        pallets: !isStep1 && supplier.pallets <= 0, // palettes non vérifiées en step1
      };
    });

    setErrorsSuppliers(newErrors);

    const hasError = Object.values(newErrors).some(err => err.name || err.pallets);

    if (hasError) {
      setShowSupplierError(true);
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return false;
    }

    setShowSupplierError(false);
    return true;
  };

  const addSupplier = () => {
    const newId = uuid();
    setSuppliers((prev) => [...prev, { id: newId, name: "", pallets: 0 }]);

    // Focus après update
    setTimeout(() => {
      supplierNameRefs.current[newId]?.focus();
    }, 50);
  };

  const updateSupplier = (
    id: string,
    field: "name" | "pallets",
    value: string | number
  ) => {
    if (field === "pallets") {
      const otherTotal = suppliers
        .filter((s) => s.id !== id)
        .reduce((sum, s) => sum + (Number(s.pallets) || 0), 0);

      const maxAllowed = Number(totalPallets) - otherTotal;
      const safeValue = Math.max(0, Math.min(Number(value), maxAllowed));

      setSuppliers((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, pallets: safeValue } : s
        )
      );
    } else {
      setSuppliers((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, name: String(value) } : s
        )
      );
    }
  };

  const removeSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
  };

  const [showPalletsError, setShowPalletsError] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateSuppliers()) return;

    const totalUsed = suppliers.reduce(
      (sum, s) => sum + (Number(s.pallets) || 0),
      0
    );
    const palletsMismatch = totalUsed !== Number(totalPallets);

    if (palletsMismatch) {
      setShake(true);
      setShowPalletsError(true); // <-- le nouveau
      setTimeout(() => setShake(false), 400);
      return;
    }
    setShowPalletsError(false); // réinitialise si ok

    console.log({ orderNumber, totalPallets, email, suppliers });
    alert("Formulaire envoyé (voir console)");
  };

  const remaining = Math.max(
    0,
    Number(totalPallets) - suppliers.reduce((sum, s) => sum + s.pallets, 0)
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl mx-auto p-6 bg-white shadow-md rounded-lg space-y-6"
    >
      <h2 className="text-center text-2xl font-bold text-gray-800 mb-4">
        Informations prise de RDV
      </h2>

      {step === 1 && (
        <div className={`space-y-4 ${shake ? "animate-shake" : ""}`}>
          {/* Numéro de commande */}
          <div>
            <label className="block mb-1 font-medium text-gray-700">
              Numéro de commande
            </label>
            <input
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="OAEMUXXXXXX"
              className={`w-full border rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition
                ${errorsStep1.orderNumber ? "border-red-500 focus:ring-red-400" : ""}`}
            />
          </div>

          {/* Total palettes */}
          <div>
            <label className="block mb-1 font-medium text-gray-700">
              Total palettes
            </label>
            <input
              type="number"
              value={totalPallets}
              onChange={(e) => setTotalPallets(Number(e.target.value))}
              className={`w-full border rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition
                ${errorsStep1.totalPallets ? "border-red-500 focus:ring-red-400" : ""}`}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block mb-1 font-medium text-gray-700">
              Email contact
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full border rounded-md px-3 py-2 text-gray-700 transition
                ${errorsStep1.email ? "border-red-500 focus:ring-red-400" : ""}`}
            />
          </div>

          {/* Message d'erreur */}
          {showErrorMessage && (
            <p className="text-red-500 text-sm mt-1">
              Veuillez remplir tous les champs pour passer à l'étape suivante
            </p>
          )}

          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={goToStep2}
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-700 transition"
            >
              Etape suivante
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          {/* Label général fournisseurs */}
          {suppliers.length > 1 && (
            <div className="grid grid-cols-12 gap-2 mb-1">
              <div className="col-span-8 text-sm font-medium text-gray-700">
                Fournisseurs
              </div>
              <div className="col-span-4 text-sm font-medium text-gray-700">
                Nombre de palettes
              </div>
            </div>
          )}

          {/* Liste des fournisseurs */}
          {suppliers.map((supplier) => {
            const singleSupplier = suppliers.length === 1;
            const hasNameError = errorsSuppliers[supplier.id]?.name;
            const hasPalletsError = errorsSuppliers[supplier.id]?.pallets;

            return (
              <div
                key={supplier.id}
                className={`grid grid-cols-12 gap-2 items-center group ${
                  shake && (hasNameError || hasPalletsError) ? "animate-shake" : ""
                }`}
              >
                {/* Nom fournisseur */}
                <div className={singleSupplier ? "col-span-12" : "col-span-8"}>
                  <input
                    value={supplier.name}
                    onChange={(e) => updateSupplier(supplier.id, "name", e.target.value)}
                    placeholder="Nom du fournisseur"
                    className={`border px-2 py-1 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition
                      ${hasNameError ? "border-red-500" : "border-black"}
                      text-black
                      placeholder-gray-500`}
                  />
                </div>

                {/* Palettes et bouton supprimer : seulement si plus d’un fournisseur */}
                {!singleSupplier && (
                  <div className="col-span-4 flex items-center gap-2 group">
                    <div className="flex-1 transition-all duration-200 group-hover:flex-[0.8]">
                      <input
                        type="number"
                        value={supplier.pallets}
                        onChange={(e) =>
                          updateSupplier(supplier.id, "pallets", Number(e.target.value))
                        }
                        className={`border px-2 py-1 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition
                          ${hasPalletsError ? "border-red-500" : "border-black"}
                          text-black
                          placeholder-gray-500`}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeSupplier(supplier.id)}
                      className="flex items-center justify-center text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition h-full"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Message global d'erreur */}
          {showSupplierError && (
            <p className="text-red-500 text-sm mt-1">
              Veuillez remplir tous les noms et attribuer au moins 1 palette par fournisseur.
            </p>
          )}

          {showPalletsError && (
            <p className="text-red-500 text-sm mt-1">
              Le total des palettes doit correspondre à la somme des palettes des fournisseurs.
            </p>
          )}

          {/* Palettes restantes */}
          {suppliers.length > 1 && (
            <div className="text-sm text-gray-600">
              Palettes restantes : <span className="font-semibold">{remaining}</span> / {totalPallets}
            </div>
          )}

          {/* Ajouter fournisseur */}
          <div>
            <button
              type="button"
              onClick={addSupplier}
              className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition"
            >
              <Plus size={18} />
              Ajouter un fournisseur
            </button>
          </div>

          {/* Navigation précédente / soumission */}
          <div className="flex justify-between mt-6">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 bg-gray-400 hover:bg-gray-300 text-white rounded-md"
            >
              Précédent
            </button>

            <button
              type="submit"
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-700 transition"
            >
              Valider le RDV
            </button>
          </div>
        </div>
      )}
    </form>
  );
}