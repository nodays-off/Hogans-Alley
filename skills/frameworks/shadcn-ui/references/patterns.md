# Common Usage Patterns

Best practices and common patterns for building applications with shadcn/ui.

## Table of Contents

- [Loading States](#loading-states)
- [Error Handling](#error-handling)
- [Confirmation Dialogs](#confirmation-dialogs)
- [Responsive Layouts](#responsive-layouts)
- [Data Fetching Patterns](#data-fetching-patterns)
- [Composable Components](#composable-components)

## Loading States

### Skeleton Loading

Use skeletons to show content placeholders while data loads:

```tsx
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

function UserCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-20 w-full" />
      </CardContent>
    </Card>
  )
}

function UserCard({ user }: { user?: User }) {
  if (!user) {
    return <UserCardSkeleton />
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarImage src={user.avatar} />
            <AvatarFallback>{user.initials}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{user.name}</h3>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p>{user.bio}</p>
      </CardContent>
    </Card>
  )
}
```

### Table Skeleton

```tsx
function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-4 w-[100px]" />
        </div>
      ))}
    </div>
  )
}
```

### Progress Indicator

```tsx
import { Progress } from "@/components/ui/progress"
import { useEffect, useState } from "react"

function DataLoader() {
  const [progress, setProgress] = useState(13)

  useEffect(() => {
    const timer = setTimeout(() => setProgress(66), 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Loading data...</p>
      <Progress value={progress} />
    </div>
  )
}
```

### Button Loading States

```tsx
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

function SubmitButton({ isLoading }: { isLoading: boolean }) {
  return (
    <Button disabled={isLoading}>
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isLoading ? "Submitting..." : "Submit"}
    </Button>
  )
}
```

## Error Handling

### Error Alert

```tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, XCircle } from "lucide-react"

function ErrorAlert({ error }: { error: Error }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{error.message}</AlertDescription>
    </Alert>
  )
}

// With retry action
function ErrorAlertWithRetry({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription className="mt-2 space-y-2">
        <p>{error.message}</p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      </AlertDescription>
    </Alert>
  )
}
```

### Error Toast

```tsx
import { useToast } from "@/hooks/use-toast"

function useApiCall() {
  const { toast } = useToast()

  async function callApi() {
    try {
      const data = await fetch('/api/data')
      toast({
        title: "Success",
        description: "Data loaded successfully.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: error instanceof Error ? error.message : "Please try again later.",
      })
    }
  }

  return { callApi }
}
```

### Error Boundary Component

```tsx
import { Component, ReactNode } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="p-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              <p>{this.state.error?.message}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => this.setState({ hasError: false })}
              >
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )
    }

    return this.props.children
  }
}
```

### Form Error Handling

```tsx
function LoginForm() {
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(data: FormData) {
    setError(null)
    try {
      await login(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Form fields */}

        <Button type="submit">Login</Button>
      </form>
    </Form>
  )
}
```

## Confirmation Dialogs

### Delete Confirmation

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

function DeleteConfirmation({ onConfirm, itemName }: { onConfirm: () => void; itemName: string }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <strong>{itemName}</strong>.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

### Async Confirmation

```tsx
function AsyncDeleteConfirmation({ onConfirm }: { onConfirm: () => Promise<void> }) {
  const [isLoading, setIsLoading] = useState(false)
  const [open, setOpen] = useState(false)

  async function handleConfirm() {
    setIsLoading(true)
    try {
      await onConfirm()
      setOpen(false)
    } catch (error) {
      // Handle error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Deleting..." : "Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

## Responsive Layouts

### Responsive Dialog/Drawer

Switch between Dialog (desktop) and Drawer (mobile):

```tsx
import { useMediaQuery } from "@/hooks/use-media-query"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

function ResponsiveDialog({ children, trigger }: { children: React.ReactNode; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          {children}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent>
        {children}
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

// Usage
<ResponsiveDialog trigger={<Button>Open</Button>}>
  <DialogHeader>
    <DialogTitle>Edit profile</DialogTitle>
    <DialogDescription>
      Make changes to your profile here.
    </DialogDescription>
  </DialogHeader>
  {/* Form content */}
</ResponsiveDialog>
```

### useMediaQuery Hook

```tsx
// hooks/use-media-query.tsx
import { useEffect, useState } from "react"

export function useMediaQuery(query: string) {
  const [value, setValue] = useState(false)

  useEffect(() => {
    function onChange(event: MediaQueryListEvent) {
      setValue(event.matches)
    }

    const result = matchMedia(query)
    result.addEventListener("change", onChange)
    setValue(result.matches)

    return () => result.removeEventListener("change", onChange)
  }, [query])

  return value
}
```

### Responsive Grid Layout

```tsx
function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <Card key={product.id}>
          <CardHeader>
            <CardTitle>{product.name}</CardTitle>
            <CardDescription>${product.price}</CardDescription>
          </CardHeader>
          <CardContent>
            <img src={product.image} alt={product.name} className="rounded-md" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

## Data Fetching Patterns

### Loading, Error, and Success States

```tsx
interface DataState<T> {
  data: T | null
  isLoading: boolean
  error: Error | null
}

function UserList() {
  const [state, setState] = useState<DataState<User[]>>({
    data: null,
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setState({ data, isLoading: false, error: null }))
      .catch(error => setState({ data: null, isLoading: false, error }))
  }, [])

  if (state.isLoading) {
    return <TableSkeleton />
  }

  if (state.error) {
    return <ErrorAlert error={state.error} />
  }

  if (!state.data || state.data.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No users found</p>
      </div>
    )
  }

  return (
    <Table>
      {/* Table content */}
    </Table>
  )
}
```

### Pagination

```tsx
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

function PaginatedList({ items, itemsPerPage = 10 }: { items: any[]; itemsPerPage?: number }) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(items.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = items.slice(startIndex, endIndex)

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {currentItems.map((item) => (
          <Card key={item.id}>
            {/* Item content */}
          </Card>
        ))}
      </div>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>

          {Array.from({ length: totalPages }).map((_, i) => (
            <PaginationItem key={i}>
              <PaginationLink
                onClick={() => setCurrentPage(i + 1)}
                isActive={currentPage === i + 1}
              >
                {i + 1}
              </PaginationLink>
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
```

### Infinite Scroll

```tsx
import { useInView } from "react-intersection-observer"

function InfiniteList() {
  const [items, setItems] = useState<Item[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const { ref, inView } = useInView()

  useEffect(() => {
    if (inView && hasMore) {
      loadMore()
    }
  }, [inView])

  async function loadMore() {
    const newItems = await fetchItems(page)
    if (newItems.length === 0) {
      setHasMore(false)
      return
    }
    setItems([...items, ...newItems])
    setPage(page + 1)
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.id}>
          {/* Item content */}
        </Card>
      ))}

      {hasMore && (
        <div ref={ref} className="text-center py-4">
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
        </div>
      )}
    </div>
  )
}
```

## Composable Components

### Reusable Card Pattern

```tsx
interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
}

function StatCard({ title, value, description, icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <p className={`text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// Usage
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  <StatCard
    title="Total Revenue"
    value="$45,231.89"
    description="+20.1% from last month"
    icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
    trend={{ value: 20.1, isPositive: true }}
  />
</div>
```

### Compound Component Pattern

```tsx
interface DataListContextValue {
  items: any[]
  isLoading: boolean
}

const DataListContext = createContext<DataListContextValue | undefined>(undefined)

function DataList({ children, items, isLoading }: { children: React.ReactNode; items: any[]; isLoading: boolean }) {
  return (
    <DataListContext.Provider value={{ items, isLoading }}>
      <div className="space-y-4">{children}</div>
    </DataListContext.Provider>
  )
}

DataList.Loading = function Loading() {
  const context = useContext(DataListContext)
  if (!context?.isLoading) return null
  return <Skeleton className="h-20 w-full" />
}

DataList.Empty = function Empty({ children }: { children: React.ReactNode }) {
  const context = useContext(DataListContext)
  if (context?.isLoading || (context?.items && context.items.length > 0)) return null
  return <div className="text-center text-muted-foreground py-10">{children}</div>
}

DataList.Items = function Items({ children }: { children: (item: any) => React.ReactNode }) {
  const context = useContext(DataListContext)
  if (context?.isLoading || !context?.items || context.items.length === 0) return null
  return <>{context.items.map(children)}</>
}

// Usage
<DataList items={users} isLoading={isLoading}>
  <DataList.Loading />
  <DataList.Empty>No users found</DataList.Empty>
  <DataList.Items>
    {(user) => <UserCard key={user.id} user={user} />}
  </DataList.Items>
</DataList>
```
