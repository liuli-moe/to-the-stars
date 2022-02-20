import { exec, ExecOptions } from 'child_process'

export function execPromise(command: string, options?: ExecOptions): Promise<string | Buffer> {
  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout) => {
      if (error) {
        reject(error)
        return
      }
      resolve(stdout)
    })
  })
}
