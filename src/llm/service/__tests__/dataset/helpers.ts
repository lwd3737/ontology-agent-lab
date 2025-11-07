type FormattedDataset<
  TInputs extends Record<string, readonly unknown[]>,
  TOutputs extends Record<string, readonly unknown[]> | undefined
> = {
  inputs: { [K in keyof TInputs]: TInputs[K][number] };
  referenceOutputs?: TOutputs extends undefined
    ? undefined
    : { [K in keyof NonNullable<TOutputs>]: NonNullable<TOutputs>[K][number] };
}[];

export const formatDataset = <
  TInputs extends Record<string, readonly unknown[]>,
  TOutputs extends Record<string, readonly unknown[]> | undefined = undefined
>(
  inputs: TInputs,
  referenceOutputs?: TOutputs
): FormattedDataset<TInputs, TOutputs> => {
  const dataset: FormattedDataset<TInputs, TOutputs> = [];

  const size = Object.values(inputs)[0]?.length ?? 0;
  const inputEntries = Object.entries(inputs) as Array<
    [keyof TInputs, TInputs[keyof TInputs]]
  >;
  const referenceOutputsEntries = referenceOutputs
    ? (Object.entries(referenceOutputs) as Array<
        [
          keyof NonNullable<TOutputs>,
          NonNullable<TOutputs>[keyof NonNullable<TOutputs>]
        ]
      >)
    : undefined;

  for (let i = 0; i < size; i++) {
    const entry = {
      inputs: {} as { [K in keyof TInputs]: TInputs[K][number] },
      referenceOutputs: undefined as TOutputs extends undefined
        ? undefined
        : {
            [K in keyof NonNullable<TOutputs>]: NonNullable<TOutputs>[K][number];
          },
    };

    inputEntries.forEach(([key, values]) => {
      if (values.length !== size) {
        throw new Error(
          `Input ${String(key)} has different length than other inputs`
        );
      }

      entry.inputs[key] = values[i] as TInputs[typeof key][number];
    });

    if (referenceOutputsEntries) {
      entry.referenceOutputs = {} as TOutputs extends undefined
        ? undefined
        : {
            [K in keyof NonNullable<TOutputs>]: NonNullable<TOutputs>[K][number];
          };

      referenceOutputsEntries.forEach(([key, values]) => {
        if (values.length !== size) {
          throw new Error(
            `Reference output ${String(
              key
            )} has different length than other reference outputs`
          );
        }

        (entry.referenceOutputs as Record<string, unknown>)[key as string] =
          values[i] as NonNullable<TOutputs>[typeof key][number];
      });
    }

    dataset.push(entry);
  }

  return dataset;
};
