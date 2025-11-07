type Dataset = {
  inputs: { [key: string]: any[] };
  referenceOutputs?: { [key: string]: any[] };
}[];

export const formatDataset = (
  inputs: Record<string, readonly any[]>,
  referenceOutputs?: Record<string, readonly any[]>
): any[] => {
  const dataset: Dataset = [];

  const size = Object.values(inputs)[0].length;
  const inputEntries = Object.entries(inputs);
  const referenceOutputsEntries = referenceOutputs
    ? Object.entries(referenceOutputs)
    : undefined;

  for (let i = 0; i < size; i++) {
    dataset[i] = {
      inputs: {},
    };

    inputEntries.forEach(([key, input]) => {
      if (input.length !== size) {
        throw new Error(`Input ${key} has different length than other inputs`);
      }
      dataset[i].inputs[key] = input[i];
    });

    if (referenceOutputsEntries) {
      dataset[i].referenceOutputs = {};

      referenceOutputsEntries.forEach(([key, output]) => {
        if (output.length !== size) {
          throw new Error(
            `Reference output ${key} has different length than other reference outputs`
          );
        }

        dataset[i].referenceOutputs![key] = output[i];
      });
    }
  }

  return dataset;
};
