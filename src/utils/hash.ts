import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export const hashPassword = async (plain: string): Promise<string> => {
  return await bcrypt.hash(plain, SALT_ROUNDS);
};

export const comparePassword = async (
  plain: string,
  hash: string
): Promise<boolean> => {
  return await bcrypt.compare(plain, hash);
};
