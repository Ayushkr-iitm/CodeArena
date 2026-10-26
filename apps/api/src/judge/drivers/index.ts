import { ISandboxDriver } from "../types";
import { LocalProcessDriver } from "./local";
import { DockerDriver } from "./docker";

const localDriver = new LocalProcessDriver();
const dockerDriver = new DockerDriver();

/**
 * Returns the best available sandbox driver:
 * If SANDBOX_DRIVER is explicitly set to "docker", tries Docker;
 * Otherwise defaults to LocalProcessDriver for immediate, zero-friction execution.
 */
export async function getSandboxDriver(): Promise<ISandboxDriver> {
  const preferredDriver = process.env.SANDBOX_DRIVER?.toLowerCase();

  if (preferredDriver === "docker") {
    const isDockerUp = await dockerDriver.isAvailable();
    if (isDockerUp) {
      return dockerDriver;
    }
    console.warn("⚠️ Docker driver requested but Docker daemon is not available. Falling back to LocalProcessDriver.");
  }

  return localDriver;
}
