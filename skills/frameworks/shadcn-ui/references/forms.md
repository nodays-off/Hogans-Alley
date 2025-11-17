# Form Components & Validation

Complete guide to building forms with shadcn/ui, React Hook Form, and Zod validation.

## Table of Contents

- [Setup](#setup)
- [Basic Form Example](#basic-form-example)
- [Form Components](#form-components)
- [Validation Patterns](#validation-patterns)
- [Advanced Examples](#advanced-examples)

## Setup

### Install Dependencies

```bash
npm install react-hook-form @hookform/resolvers zod
npx shadcn@latest add form input button label
```

### Required Imports

```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
```

## Basic Form Example

```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

// 1. Define schema
const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }).max(50),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
})

// 2. Create form component
function ProfileForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
    },
  })

  // 3. Define submit handler
  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
    // API call, etc.
  }

  // 4. Render form
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="shadcn" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
```

## Form Components

### Text Input

```tsx
<FormField
  control={form.control}
  name="username"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Username</FormLabel>
      <FormControl>
        <Input placeholder="shadcn" {...field} />
      </FormControl>
      <FormDescription>Optional description</FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Textarea

```tsx
import { Textarea } from "@/components/ui/textarea"

<FormField
  control={form.control}
  name="bio"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Bio</FormLabel>
      <FormControl>
        <Textarea
          placeholder="Tell us about yourself"
          className="resize-none"
          {...field}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Select

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

<FormField
  control={form.control}
  name="country"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Country</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select a country" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="us">United States</SelectItem>
          <SelectItem value="uk">United Kingdom</SelectItem>
          <SelectItem value="ca">Canada</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Checkbox

```tsx
import { Checkbox } from "@/components/ui/checkbox"

<FormField
  control={form.control}
  name="acceptTerms"
  render={({ field }) => (
    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
      <FormControl>
        <Checkbox
          checked={field.value}
          onCheckedChange={field.onChange}
        />
      </FormControl>
      <div className="space-y-1 leading-none">
        <FormLabel>
          Accept terms and conditions
        </FormLabel>
        <FormDescription>
          You agree to our Terms of Service and Privacy Policy.
        </FormDescription>
      </div>
    </FormItem>
  )}
/>
```

### Multiple Checkboxes

```tsx
const items = [
  { id: "recents", label: "Recents" },
  { id: "home", label: "Home" },
  { id: "applications", label: "Applications" },
] as const

<FormField
  control={form.control}
  name="items"
  render={() => (
    <FormItem>
      <div className="mb-4">
        <FormLabel className="text-base">Sidebar</FormLabel>
        <FormDescription>
          Select the items you want to display.
        </FormDescription>
      </div>
      {items.map((item) => (
        <FormField
          key={item.id}
          control={form.control}
          name="items"
          render={({ field }) => {
            return (
              <FormItem
                key={item.id}
                className="flex flex-row items-start space-x-3 space-y-0"
              >
                <FormControl>
                  <Checkbox
                    checked={field.value?.includes(item.id)}
                    onCheckedChange={(checked) => {
                      return checked
                        ? field.onChange([...field.value, item.id])
                        : field.onChange(
                            field.value?.filter(
                              (value) => value !== item.id
                            )
                          )
                    }}
                  />
                </FormControl>
                <FormLabel className="font-normal">
                  {item.label}
                </FormLabel>
              </FormItem>
            )
          }}
        />
      ))}
      <FormMessage />
    </FormItem>
  )}
/>
```

### Radio Group

```tsx
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

<FormField
  control={form.control}
  name="type"
  render={({ field }) => (
    <FormItem className="space-y-3">
      <FormLabel>Notify me about...</FormLabel>
      <FormControl>
        <RadioGroup
          onValueChange={field.onChange}
          defaultValue={field.value}
          className="flex flex-col space-y-1"
        >
          <FormItem className="flex items-center space-x-3 space-y-0">
            <FormControl>
              <RadioGroupItem value="all" />
            </FormControl>
            <FormLabel className="font-normal">
              All new messages
            </FormLabel>
          </FormItem>
          <FormItem className="flex items-center space-x-3 space-y-0">
            <FormControl>
              <RadioGroupItem value="mentions" />
            </FormControl>
            <FormLabel className="font-normal">
              Direct messages and mentions
            </FormLabel>
          </FormItem>
          <FormItem className="flex items-center space-x-3 space-y-0">
            <FormControl>
              <RadioGroupItem value="none" />
            </FormControl>
            <FormLabel className="font-normal">Nothing</FormLabel>
          </FormItem>
        </RadioGroup>
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Switch

```tsx
import { Switch } from "@/components/ui/switch"

<FormField
  control={form.control}
  name="marketingEmails"
  render={({ field }) => (
    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
      <div className="space-y-0.5">
        <FormLabel className="text-base">Marketing emails</FormLabel>
        <FormDescription>
          Receive emails about new products, features, and more.
        </FormDescription>
      </div>
      <FormControl>
        <Switch
          checked={field.value}
          onCheckedChange={field.onChange}
        />
      </FormControl>
    </FormItem>
  )}
/>
```

### Date Picker

```tsx
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

<FormField
  control={form.control}
  name="dob"
  render={({ field }) => (
    <FormItem className="flex flex-col">
      <FormLabel>Date of birth</FormLabel>
      <Popover>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              variant={"outline"}
              className={cn(
                "w-[240px] pl-3 text-left font-normal",
                !field.value && "text-muted-foreground"
              )}
            >
              {field.value ? (
                format(field.value, "PPP")
              ) : (
                <span>Pick a date</span>
              )}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={field.value}
            onSelect={field.onChange}
            disabled={(date) =>
              date > new Date() || date < new Date("1900-01-01")
            }
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <FormDescription>
        Your date of birth is used to calculate your age.
      </FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

## Validation Patterns

### Common Zod Schemas

```tsx
// String validations
z.string()
z.string().min(2, "Too short")
z.string().max(50, "Too long")
z.string().email("Invalid email")
z.string().url("Invalid URL")
z.string().regex(/^[a-zA-Z]+$/, "Letters only")

// Number validations
z.number()
z.number().min(0)
z.number().max(100)
z.number().positive()
z.number().int()

// Date validations
z.date()
z.date().min(new Date("1900-01-01"))
z.date().max(new Date())

// Boolean
z.boolean()

// Optional fields
z.string().optional()
z.string().nullable()

// Arrays
z.array(z.string())
z.array(z.string()).min(1, "Select at least one")
z.array(z.string()).max(5)

// Objects
z.object({
  name: z.string(),
  age: z.number(),
})

// Enums
z.enum(["admin", "user", "guest"])

// Conditional validation
z.string().refine((val) => val !== "admin", {
  message: "Username cannot be 'admin'",
})

// Custom validation
z.string().refine(
  async (value) => {
    const exists = await checkIfExists(value)
    return !exists
  },
  { message: "This username is already taken" }
)
```

### Password Validation

```tsx
const formSchema = z.object({
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain uppercase letter")
    .regex(/[a-z]/, "Must contain lowercase letter")
    .regex(/[0-9]/, "Must contain number")
    .regex(/[^A-Za-z0-9]/, "Must contain special character"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})
```

### Conditional Validation

```tsx
const formSchema = z.object({
  hasShippingAddress: z.boolean(),
  shippingAddress: z.string().optional(),
}).refine(
  (data) => {
    if (data.hasShippingAddress) {
      return !!data.shippingAddress
    }
    return true
  },
  {
    message: "Shipping address is required",
    path: ["shippingAddress"],
  }
)
```

## Advanced Examples

### Multi-Step Form

```tsx
const [step, setStep] = useState(1)

const formSchema = z.object({
  // Step 1
  email: z.string().email(),
  password: z.string().min(8),

  // Step 2
  firstName: z.string().min(2),
  lastName: z.string().min(2),

  // Step 3
  address: z.string().min(5),
  city: z.string().min(2),
})

function MultiStepForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (step < 3) {
      setStep(step + 1)
    } else {
      console.log(values)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {step === 1 && (
          <>
            {/* Email & Password fields */}
          </>
        )}

        {step === 2 && (
          <>
            {/* Name fields */}
          </>
        )}

        {step === 3 && (
          <>
            {/* Address fields */}
          </>
        )}

        <div className="flex justify-between">
          {step > 1 && (
            <Button type="button" onClick={() => setStep(step - 1)}>
              Previous
            </Button>
          )}
          <Button type="submit">
            {step === 3 ? "Submit" : "Next"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
```

### Dynamic Fields

```tsx
import { useFieldArray } from "react-hook-form"

const formSchema = z.object({
  emails: z.array(
    z.object({
      value: z.string().email(),
    })
  ),
})

function DynamicForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      emails: [{ value: "" }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "emails",
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(console.log)}>
        {fields.map((field, index) => (
          <FormField
            key={field.id}
            control={form.control}
            name={`emails.${index}.value`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email {index + 1}</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => remove(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={() => append({ value: "" })}
        >
          Add Email
        </Button>

        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
```

### Server Actions (Next.js)

```tsx
// app/actions.ts
"use server"

import { z } from "zod"

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export async function createUser(formData: FormData) {
  const validatedFields = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  // Create user
  const { email, password } = validatedFields.data
  // ... database operation

  return { success: true }
}

// app/signup/page.tsx
import { createUser } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function SignupPage() {
  return (
    <form action={createUser}>
      <Input name="email" type="email" required />
      <Input name="password" type="password" required />
      <Button type="submit">Sign up</Button>
    </form>
  )
}
```

### Reusable Form Field Component

```tsx
// lib/form-utils.tsx
import { UseFormReturn } from "react-hook-form"
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

interface TextFormFieldProps {
  form: UseFormReturn<any>
  name: string
  label: string
  placeholder?: string
  description?: string
  type?: string
}

export function TextFormField({
  form,
  name,
  label,
  placeholder,
  description,
  type = "text",
}: TextFormFieldProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input type={type} placeholder={placeholder} {...field} />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// Usage
<TextFormField
  form={form}
  name="email"
  label="Email"
  type="email"
  placeholder="you@example.com"
  description="We'll never share your email."
/>
```

### Loading States

```tsx
function ProfileForm() {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      await submitForm(values)
      toast({ title: "Success!" })
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Submitting..." : "Submit"}
        </Button>
      </form>
    </Form>
  )
}
```
