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

    const thisDate = new Date(value).getTime();
    const otherDate = new Date(other).getTime();

    if (Number.isNaN(thisDate) || Number.isNaN(otherDate)) {
      return true;
    }

    return thisDate >= otherDate;
  }
}