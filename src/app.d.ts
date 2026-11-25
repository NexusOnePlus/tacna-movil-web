declare global {
	namespace App {
		interface Locals {
			/** Origen absoluto de la landing ('' en local), para volver desde el panel. */
			landingOrigin: string;
		}
	}
}

export {};
