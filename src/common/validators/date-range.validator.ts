import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'isNotBefore', async: false })
export class IsNotBeforeConstraint implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments): boolean {
    const [otherProperty] = args.constraints as string[];
    const other = (args.object as Record<string, unknown>)[otherProperty];

    if (typeof value !== 'string' || typeof other !== 'string') {
      return true;
    }

    return new Date(value).getTime() >= new Date(other).getTime();
  }

  defaultMessage(args: ValidationArguments): string {
    const [otherProperty] = args.constraints as string[];
    return `${args.property} must not be earlier than ${otherProperty}`;
  }
}