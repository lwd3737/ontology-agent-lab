export const formatInputs = (key: string, inputs: readonly any[]) => {
  return inputs.map((input) => {
    return {
      inputs: {
        [key]: input,
      },
    };
  });
};
