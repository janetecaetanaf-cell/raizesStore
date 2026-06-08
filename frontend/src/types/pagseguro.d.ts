export {};

declare global {
  interface Window {
    PagSeguro?: {
      encryptCard: (options: {
        publicKey: string;
        holder: string;
        number: string;
        expMonth: string;
        expYear: string;
        securityCode: string;
      }) => {
        encryptedCard: string;
        hasErrors: boolean;
        errors: { code: string; message: string }[];
      };
    };
  }
}
