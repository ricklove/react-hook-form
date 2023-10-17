import {
  DeepMap,
  DeepPartial,
  ErrorOption,
  FieldErrors,
  FieldPath,
  FieldValues,
  RegisterOptions,
  Resolver,
} from '../types';
import set from '../utils/set';

class ServerActionsValidator<TFieldValues extends FieldValues> {
  private values: FieldValues | FormData;
  private options: { resolver: Resolver<FieldValues> };
  private rules: DeepMap<
    DeepPartial<TFieldValues>,
    RegisterOptions<TFieldValues>
  > = {} as DeepMap<DeepPartial<TFieldValues>, RegisterOptions<TFieldValues>>;
  private errors: FieldErrors<TFieldValues> = {};

  constructor(
    values: TFieldValues | FormData,
    options: { resolver: Resolver<FieldValues> },
  ) {
    this.values =
      values instanceof FormData ? this.formDataToValues(values) : values;
    this.options = options;
  }

  private formDataToValues(formData: FormData) {
    return Object.fromEntries(formData.entries()) as TFieldValues;
  }

  public register(
    name: FieldPath<TFieldValues>,
    options: RegisterOptions<TFieldValues>,
  ) {
    set(this.rules, name, options);
    return this;
  }

  public async validate() {
    if (this.options.resolver) {
      const result = await this.options.resolver(this.values, undefined, {
        fields: {},
        shouldUseNativeValidation: false,
      });
      this.errors = {
        ...this.errors,
        ...result.errors,
      };
      return this;
    }
    // TODO: impl native validation
    return this;
  }

  public setError(
    name: FieldPath<TFieldValues> | `root.${string}` | 'root',
    error: ErrorOption,
  ) {
    set(this.errors, name, error);
    return this;
  }

  public getErrorsResponse(): {
    $RHF: true;
    errors: FieldErrors<TFieldValues>;
  } {
    return {
      $RHF: true,
      errors: this.errors,
    };
  }

  public isValid() {
    return Object.keys(this.errors).length === 0;
  }
}

export const createServerActionsValidator = <TFieldValues extends FieldValues>(
  values: TFieldValues | FormData,
  options: { resolver: Resolver<FieldValues> },
) => new ServerActionsValidator(values, options);
