import React from 'react';

interface NutritionLabelProps {
  title: string;
  servingSize?: string;
  calories: number;
  fat: number;
  saturatedFat?: number;
  transFat?: number;
  carbs: number;
  fiber: number;
  sugars: number;
  protein: number;
  sodium: number;
  priceCAD?: number;
}

export const NutritionLabel: React.FC<NutritionLabelProps> = ({
  title,
  servingSize = '1 serving',
  calories,
  fat,
  saturatedFat = 0,
  transFat = 0,
  carbs,
  fiber,
  sugars,
  protein,
  sodium,
  priceCAD,
}) => {
  // Canadian Daily Value benchmarks (Health Canada)
  const dvFat = Math.round((fat / 75) * 100);
  const dvSatTrans = Math.round(((saturatedFat + transFat) / 20) * 100);
  const dvCarbs = Math.round((carbs / 300) * 100);
  const dvFiber = Math.round((fiber / 28) * 100);
  const dvSodium = Math.round((sodium / 2300) * 100);

  return (
    <div className="w-full max-w-sm bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 p-4 font-sans text-neutral-900 dark:text-neutral-100 shadow-sm rounded-none">
      <div className="border-b-8 border-black dark:border-neutral-200 pb-1">
        <h3 className="text-2xl font-black tracking-tight leading-tight uppercase font-sans">
          Nutrition Facts
        </h3>
        <p className="text-xs font-semibold tracking-wide text-neutral-600 dark:text-neutral-400">
          Valeur nutritive
        </p>
      </div>

      <div className="py-1.5 border-b border-black dark:border-neutral-700 text-xs">
        <div className="flex justify-between items-baseline">
          <span className="font-semibold text-neutral-700 dark:text-neutral-300">Item:</span>
          <span className="font-bold text-right truncate max-w-[200px]">{title}</span>
        </div>
        <div className="flex justify-between items-baseline mt-0.5">
          <span className="text-neutral-600 dark:text-neutral-400">Per {servingSize}</span>
          {priceCAD !== undefined && (
            <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200">
              ${priceCAD.toFixed(2)} CAD
            </span>
          )}
        </div>
      </div>

      <div className="flex justify-between items-baseline py-2 border-b-4 border-black dark:border-neutral-200">
        <div>
          <span className="text-sm font-bold">Calories </span>
          <span className="text-2xl font-black font-mono tabular-nums">{calories}</span>
        </div>
        <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase">
          % Daily Value*
        </span>
      </div>

      <div className="text-xs divide-y divide-neutral-200 dark:divide-neutral-800">
        <div className="flex justify-between py-1">
          <span>
            <strong className="font-bold">Fat / Lipides </strong>
            <span className="font-mono tabular-nums">{fat}g</span>
          </span>
          <span className="font-bold font-mono tabular-nums">{dvFat}%</span>
        </div>

        <div className="flex justify-between py-1 pl-4 text-neutral-700 dark:text-neutral-300">
          <span>
            Saturated / saturés <span className="font-mono tabular-nums">{saturatedFat}g</span>
            {transFat > 0 && (
              <>
                {' '}+ Trans / trans <span className="font-mono tabular-nums">{transFat}g</span>
              </>
            )}
          </span>
          <span className="font-bold font-mono tabular-nums">{dvSatTrans}%</span>
        </div>

        <div className="flex justify-between py-1">
          <span>
            <strong className="font-bold">Carbohydrate / Glucides </strong>
            <span className="font-mono tabular-nums">{carbs}g</span>
          </span>
          <span className="font-bold font-mono tabular-nums">{dvCarbs}%</span>
        </div>

        <div className="flex justify-between py-1 pl-4 text-neutral-700 dark:text-neutral-300">
          <span>Fibre / Fibres <span className="font-mono tabular-nums">{fiber}g</span></span>
          <span className="font-bold font-mono tabular-nums">{dvFiber}%</span>
        </div>

        <div className="flex justify-between py-1 pl-4 text-neutral-700 dark:text-neutral-300">
          <span>Sugars / Sucres <span className="font-mono tabular-nums">{sugars}g</span></span>
          <span className="font-mono tabular-nums">{Math.round((sugars / 100) * 100)}%</span>
        </div>

        <div className="flex justify-between py-1">
          <span>
            <strong className="font-bold">Protein / Protéines </strong>
            <span className="font-mono tabular-nums">{protein}g</span>
          </span>
          <span className="text-xs text-neutral-500 font-mono">
            {Math.round((protein / 50) * 100)}%
          </span>
        </div>

        <div className="flex justify-between py-1 border-b-2 border-black dark:border-neutral-200">
          <span>
            <strong className="font-bold">Sodium </strong>
            <span className="font-mono tabular-nums">{sodium}mg</span>
          </span>
          <span className="font-bold font-mono tabular-nums">{dvSodium}%</span>
        </div>
      </div>

      <div className="pt-2 text-[10px] text-neutral-500 dark:text-neutral-400 leading-tight">
        *5% or less is a little, 15% or more is a lot. Based on standard Health Canada reference daily intakes.
      </div>
    </div>
  );
};
