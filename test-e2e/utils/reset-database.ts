import { exec, ExecException } from 'child_process';

export async function resetDatabase() {
  const result = await new Promise((resolve, reject) => {
    exec(
      `DATABASE_URL='${process.env.DATABASE_URL}' npm run migration:reset`,
      (error: ExecException, stdout: string) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      },
    );
  });
  return result;
}
