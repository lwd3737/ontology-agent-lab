type Dataset<
  TInputs extends Record<string, unknown>,
  TOutputs extends Record<string, unknown> | never = never
> = {
  inputs: TInputs;
  referenceOutputs?: TOutputs;
}[];

export const formatDataset = <
  TInputs extends Record<string, unknown>,
  TOutputs extends Record<string, unknown> | never = never
>(
  inputs: { [K in keyof TInputs]: TInputs[K][] },
  referenceOutputs?: TOutputs extends never
    ? never
    : { [K in keyof TOutputs]: TOutputs[K][] }
): Dataset<TInputs, TOutputs> => {
  const dataset: Dataset<TInputs, TOutputs> = [];

  const size = Object.values(inputs)[0]?.length ?? 0;
  const inputEntries = Object.entries(inputs);
  const referenceOutputsEntries = referenceOutputs
    ? Object.entries(referenceOutputs)
    : undefined;

  for (let i = 0; i < size; i++) {
    dataset[i] = {
      inputs: {} as TInputs,
    };

    inputEntries.forEach(([key, input]) => {
      if (input.length !== size) {
        throw new Error(`Input ${key} has different length than other inputs`);
      }

      dataset[i].inputs[key as keyof TInputs] = input[
        i
      ] as TInputs[keyof TInputs];
    });

    if (referenceOutputsEntries) {
      dataset[i].referenceOutputs = {} as TOutputs;

      referenceOutputsEntries.forEach(([key, output]) => {
        if (output.length !== size) {
          throw new Error(
            `Reference output ${key} has different length than other reference outputs`
          );
        }

        dataset[i].referenceOutputs![key as keyof TOutputs] = output[
          i
        ] as TOutputs[keyof TOutputs];
      });
    }
  }

  return dataset;
};
