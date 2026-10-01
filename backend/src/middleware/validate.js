import { ZodError } from "zod";

export const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      if (schema.query) {
        Object.defineProperty(req, 'query', { value: schema.query.parse(req.query), configurable: true });
      }
      if (schema.params) {
        Object.defineProperty(req, 'params', { value: schema.params.parse(req.params), configurable: true });
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: "Validation error",
          message: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "),
          details: error.errors,
        });
      }
      next(error);
    }
  };
};
