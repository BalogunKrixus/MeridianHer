"use client"

import * as React from "react"
import {
  BellIcon,
  BookmarkIcon,
  CalendarIcon,
  ChevronDownIcon,
  FlagIcon,
  InfoIcon,
  MailIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  ShieldAlertIcon,
  Trash2Icon,
  TriangleAlertIcon,
  UserIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/accordion"
import { Alert, AlertDescription, AlertTitle } from "../components/alert"
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
} from "../components/alert-dialog"
import { Avatar, AvatarFallback } from "../components/avatar"
import { Badge } from "../components/badge"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "../components/breadcrumb"
import { Button } from "../components/button"
import { ButtonGroup } from "../components/button-group"
import { Calendar } from "../components/calendar"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/card"
import { Checkbox } from "../components/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../components/collapsible"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "../components/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/dialog"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "../components/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/dropdown-menu"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "../components/field"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../components/hover-card"
import { Input } from "../components/input"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "../components/input-group"
import { Kbd, KbdGroup } from "../components/kbd"
import { Label } from "../components/label"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../components/pagination"
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "../components/popover"
import { Progress } from "../components/progress"
import { RadioGroup, RadioGroupItem } from "../components/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/select"
import { Separator } from "../components/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "../components/sheet"
import { Skeleton } from "../components/skeleton"
import { Spinner } from "../components/spinner"
import { Switch } from "../components/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/tabs"
import { Textarea } from "../components/textarea"
import { Toggle } from "../components/toggle"
import { ToggleGroup, ToggleGroupItem } from "../components/toggle-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "../components/tooltip"
import { VerifiedTick } from "../patterns/badges"
import { Label as GLabel, Row, Section, Specimen } from "./layout"

const SPACES = [
  { label: "Periods and cycles", value: "periods" },
  { label: "Menopause", value: "menopause" },
  { label: "Postpartum", value: "postpartum" },
]

export function Primitives() {
  const [paletteOpen, setPaletteOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(new Date(2026, 10, 12))

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setPaletteOpen((o) => !o)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <Section
      id="primitives"
      title="Primitives"
      description="Your shadcn components (Base UI, base nova) with the brand layer. On a phone every control is at least 44px; with a mouse on desktop they stay compact."
    >
      <Specimen title="Button" note="Variants and sizes. Primary plum for one main action per screen.">
        <div className="space-y-5">
          <div>
            <GLabel>Variants</GLabel>
            <Row>
              <Button>Ask your question</Button>
              <Button variant="secondary">Follow space</Button>
              <Button variant="outline">Cancel</Button>
              <Button variant="ghost">Skip</Button>
              <Button variant="destructive">Delete post</Button>
              <Button variant="link">Read the guidelines</Button>
            </Row>
          </div>
          <div>
            <GLabel>Sizes</GLabel>
            <Row>
              <Button size="xs">Extra small</Button>
              <Button size="sm">Small</Button>
              <Button>Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon-xs" variant="outline" aria-label="Add"><PlusIcon /></Button>
              <Button size="icon-sm" variant="outline" aria-label="Add"><PlusIcon /></Button>
              <Button size="icon" variant="outline" aria-label="Add"><PlusIcon /></Button>
              <Button size="icon-lg" variant="outline" aria-label="Add"><PlusIcon /></Button>
            </Row>
          </div>
          <div>
            <GLabel>States</GLabel>
            <Row>
              <Button disabled>Disabled</Button>
              <Button disabled>
                <Spinner data-icon="inline-start" /> Posting
              </Button>
              <Button variant="outline">
                <MailIcon data-icon="inline-start" /> With icon
              </Button>
              <ButtonGroup>
                <Button variant="outline">Top</Button>
                <Button variant="outline">Oldest</Button>
                <Button variant="outline" size="icon" aria-label="More sort options"><ChevronDownIcon /></Button>
              </ButtonGroup>
            </Row>
          </div>
        </div>
      </Specimen>

      <Specimen title="Badge">
        <Row>
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="soft">Soft</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="expert">Expert</Badge>
          <Badge variant="team">Team</Badge>
          <Badge variant="success">Approved</Badge>
          <Badge variant="warning">Held</Badge>
          <Badge variant="destructive">Banned</Badge>
        </Row>
      </Specimen>

      <div className="grid gap-10 lg:grid-cols-2">
        <Specimen title="Form fields" note="Field family with Zod on the server. Invalid state shown on the last field.">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="g-name">Display name</FieldLabel>
              <Input id="g-name" placeholder="Amber Fern" />
              <FieldDescription>This is how you appear. Never your real name.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="g-space">Space</FieldLabel>
              <Select items={SPACES} defaultValue="periods">
                <SelectTrigger id="g-space" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPACES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="g-search">Search</FieldLabel>
              <InputGroup>
                <InputGroupAddon><SearchIcon /></InputGroupAddon>
                <InputGroupInput id="g-search" placeholder="Search posts, spaces and experts" />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton>Search</InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </Field>
            <Field>
              <FieldLabel htmlFor="g-bio">Short bio</FieldLabel>
              <Textarea id="g-bio" placeholder="Consultant gynaecologist in Lagos" />
            </Field>
            <Field data-invalid>
              <FieldLabel htmlFor="g-year">Year of birth</FieldLabel>
              <Input id="g-year" defaultValue="2013" aria-invalid />
              <FieldError>You need to be 16 or older to join.</FieldError>
            </Field>
          </FieldGroup>
        </Specimen>

        <Specimen title="Choice controls" note="Checkbox, radio and switch stay small visually but get a 44px hit area on touch.">
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="gap-3"><Checkbox defaultChecked /> I accept the community guidelines</Label>
              <Label className="gap-3"><Checkbox /> Email me a weekly best of my spaces</Label>
              <div className="group" data-disabled="true">
                <Label className="gap-3"><Checkbox disabled /> Disabled option</Label>
              </div>
            </div>
            <Separator />
            <RadioGroup defaultValue="top" aria-label="Sort replies">
              <Label className="gap-3"><RadioGroupItem value="top" /> Top replies first</Label>
              <Label className="gap-3"><RadioGroupItem value="oldest" /> Oldest first</Label>
            </RadioGroup>
            <Separator />
            <div className="space-y-3">
              <Label className="justify-between"><span>Hide my activity</span><Switch /></Label>
              <Label className="justify-between"><span>Expert answer emails</span><Switch defaultChecked /></Label>
            </div>
            <Separator />
            <div>
              <GLabel>Toggle and toggle group</GLabel>
              <Row>
                <Toggle aria-label="Bookmark"><BookmarkIcon /></Toggle>
                <ToggleGroup variant="outline" spacing={0} defaultValue={["for-you"]}>
                  <ToggleGroupItem value="for-you">For you</ToggleGroupItem>
                  <ToggleGroupItem value="new">New</ToggleGroupItem>
                  <ToggleGroupItem value="unanswered">Unanswered</ToggleGroupItem>
                </ToggleGroup>
              </Row>
            </div>
          </div>
        </Specimen>
      </div>

      <Specimen title="Tabs" note="Pill tabs for settings, line tabs for feed sorting.">
        <div className="space-y-6">
          <Tabs defaultValue="for-you">
            <TabsList variant="line">
              <TabsTrigger value="for-you">For you</TabsTrigger>
              <TabsTrigger value="new">New</TabsTrigger>
              <TabsTrigger value="unanswered">Unanswered</TabsTrigger>
              <TabsTrigger value="expert">Expert answered</TabsTrigger>
            </TabsList>
            <TabsContent value="for-you" className="pt-2 text-muted-foreground">Posts from the spaces you follow.</TabsContent>
            <TabsContent value="new" className="pt-2 text-muted-foreground">Newest first.</TabsContent>
            <TabsContent value="unanswered" className="pt-2 text-muted-foreground">Questions waiting for a first reply.</TabsContent>
            <TabsContent value="expert" className="pt-2 text-muted-foreground">Questions with an expert answer.</TabsContent>
          </Tabs>
          <Tabs defaultValue="account">
            <TabsList>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </Specimen>

      <div className="grid gap-10 lg:grid-cols-3">
        <Specimen title="Card: default" bare>
          <Card>
            <CardHeader>
              <CardTitle>Soft shadow</CardTitle>
              <CardDescription>The default surface. No border.</CardDescription>
              <CardAction><Badge variant="soft">New</Badge></CardAction>
            </CardHeader>
            <CardContent className="text-muted-foreground">Used for post cards and panels.</CardContent>
            <CardFooter><Button size="sm" variant="secondary">Action</Button></CardFooter>
          </Card>
        </Specimen>
        <Specimen title="Card: outline" bare>
          <Card variant="outline">
            <CardHeader>
              <CardTitle>Hairline</CardTitle>
              <CardDescription>Where a shadow cannot work.</CardDescription>
            </CardHeader>
            <CardContent className="text-muted-foreground">For nested surfaces.</CardContent>
          </Card>
        </Specimen>
        <Specimen title="Card: flat, small" bare>
          <Card variant="flat" size="sm">
            <CardHeader>
              <CardTitle>Quiet surface</CardTitle>
              <CardDescription>Dense admin panels.</CardDescription>
            </CardHeader>
            <CardContent className="text-muted-foreground">Compact padding.</CardContent>
          </Card>
        </Specimen>
      </div>

      <Specimen title="Alert">
        <div className="grid gap-3 md:grid-cols-2">
          <Alert>
            <InfoIcon />
            <AlertTitle>Your post is being checked</AlertTitle>
            <AlertDescription>It will appear shortly. We check new posts to keep everyone safe.</AlertDescription>
          </Alert>
          <Alert variant="warning">
            <TriangleAlertIcon />
            <AlertTitle>You are offline</AlertTitle>
            <AlertDescription>Showing saved posts. New replies will load when you reconnect.</AlertDescription>
          </Alert>
          <Alert variant="success">
            <ShieldAlertIcon />
            <AlertTitle>Report received</AlertTitle>
            <AlertDescription>Thank you. A moderator will review it within 12 hours.</AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <FlagIcon />
            <AlertTitle>This post was removed</AlertTitle>
            <AlertDescription>It broke rule 3: no selling.</AlertDescription>
          </Alert>
          <Alert variant="expert" className="md:col-span-2">
            <VerifiedTick />
            <AlertTitle>You are a verified expert</AlertTitle>
            <AlertDescription>Your answers now carry the expert badge. Renewal due November 2027.</AlertDescription>
          </Alert>
        </div>
      </Specimen>

      <Specimen title="Overlays" note="Dialog, alert dialog, sheet, drawer, popover, hover card, dropdown, tooltip, toast. Open each to check focus, Escape and motion.">
        <Row>
          <Dialog>
            <DialogTrigger render={<Button variant="outline" />}>Dialog</DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change your display name</DialogTitle>
                <DialogDescription>You can change it once every 30 days.</DialogDescription>
              </DialogHeader>
              <Input aria-label="New display name" defaultValue="Amber Fern" />
              <DialogFooter showCloseButton>
                <Button>Save name</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive" />}>
              <Trash2Icon data-icon="inline-start" /> Alert dialog
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Ban Bright Lily?</AlertDialogTitle>
                <AlertDialogDescription>
                  This blocks the account and its Google ID from rejoining. The member can appeal once.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive">Ban member</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Sheet>
            <SheetTrigger render={<Button variant="outline" />}>Sheet</SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>Narrow the feed by tag.</SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>

          <Drawer>
            <DrawerTrigger render={<Button variant="outline" />}>Drawer</DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Share this post</DrawerTitle>
                <DrawerDescription>Swipe down to close.</DrawerDescription>
              </DrawerHeader>
              <div className="p-4 pt-0"><Button className="w-full">Copy link</Button></div>
            </DrawerContent>
          </Drawer>

          <Popover>
            <PopoverTrigger render={<Button variant="outline" />}>Popover</PopoverTrigger>
            <PopoverContent>
              <PopoverHeader>
                <PopoverTitle>Why can I not post yet?</PopoverTitle>
                <PopoverDescription>New accounts have their first two posts checked by a moderator.</PopoverDescription>
              </PopoverHeader>
            </PopoverContent>
          </Popover>

          <HoverCard>
            <HoverCardTrigger render={<a href="#" className="relative tap-target text-sm font-medium text-primary underline-offset-4 hover:underline" />}>
              Dr Amaka Obi
            </HoverCardTrigger>
            <HoverCardContent>
              <p className="flex items-center gap-1 font-medium">Dr Amaka Obi <VerifiedTick /></p>
              <p className="text-muted-foreground">Consultant gynaecologist · MDCN · verified Nov 2026</p>
              <p className="mt-2 text-muted-foreground">128 answers</p>
            </HoverCardContent>
          </HoverCard>

          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" />}>
              Menu <ChevronDownIcon data-icon="inline-end" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-52">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Amber Fern</DropdownMenuLabel>
                <DropdownMenuItem><UserIcon /> Profile</DropdownMenuItem>
                <DropdownMenuItem><BookmarkIcon /> Saved</DropdownMenuItem>
                <DropdownMenuItem><SettingsIcon /> Settings</DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem defaultChecked>Email digest</DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Tooltip>
            <TooltipTrigger render={<Button variant="outline" size="icon" aria-label="Notifications" />}>
              <BellIcon />
            </TooltipTrigger>
            <TooltipContent>Notifications</TooltipContent>
          </Tooltip>

          <Button variant="outline" onClick={() => toast.success("Saved to your list")}>Toast</Button>
          <Button variant="outline" onClick={() => toast("Reply posted", { action: { label: "View", onClick: () => {} } })}>
            Toast with action
          </Button>
        </Row>
      </Specimen>

      <div className="grid gap-10 lg:grid-cols-2">
        <Specimen title="Command palette" note="Admin opens it with Ctrl or Cmd plus K. Try it now.">
          <Command className="rounded-lg ring-1 ring-border">
            <CommandInput placeholder="Search members, posts, actions" />
            <CommandList>
              <CommandEmpty>No results.</CommandEmpty>
              <CommandGroup heading="Go to">
                <CommandItem>Moderation queue <CommandShortcut>G Q</CommandShortcut></CommandItem>
                <CommandItem>Members <CommandShortcut>G M</CommandShortcut></CommandItem>
                <CommandItem>Expert applications</CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
          <p className="mt-3 flex items-center gap-2 text-small text-muted-foreground">
            Shortcut <KbdGroup><Kbd>Ctrl</Kbd><Kbd>K</Kbd></KbdGroup>
          </p>
          <CommandDialog open={paletteOpen} onOpenChange={setPaletteOpen} title="Command palette" description="Search for an action">
            <Command>
              <CommandInput placeholder="Type an action or search" />
              <CommandList>
                <CommandEmpty>No results.</CommandEmpty>
                <CommandGroup heading="Actions">
                  <CommandItem>Open urgent queue</CommandItem>
                  <CommandItem>Invite an expert</CommandItem>
                  <CommandItem>Write a team announcement</CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </CommandDialog>
        </Specimen>

        <Specimen title="Accordion and collapsible">
          <Accordion defaultValue={["r1"]}>
            <AccordionItem value="r1">
              <AccordionTrigger>Who can see my real name?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Only authorised admins, and every time they look it is logged with a reason.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="r2">
              <AccordionTrigger>What does the expert badge mean?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We checked their licence against a public register. A badge can never be bought.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <Collapsible className="mt-4">
            <CollapsibleTrigger render={<Button variant="ghost" size="sm" />}>Show 3 more replies</CollapsibleTrigger>
            <CollapsibleContent className="pt-2 text-sm text-muted-foreground">Hidden replies appear here.</CollapsibleContent>
          </Collapsible>
        </Specimen>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <Specimen title="Table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Space</TableHead>
                <TableHead className="text-right">Posts this week</TableHead>
                <TableHead className="text-right">Unanswered</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow><TableCell>Periods and cycles</TableCell><TableCell className="text-right tabular-nums">142</TableCell><TableCell className="text-right tabular-nums">8</TableCell></TableRow>
              <TableRow><TableCell>Menopause</TableCell><TableCell className="text-right tabular-nums">97</TableCell><TableCell className="text-right tabular-nums">3</TableCell></TableRow>
              <TableRow><TableCell>Postpartum</TableCell><TableCell className="text-right tabular-nums">64</TableCell><TableCell className="text-right tabular-nums">11</TableCell></TableRow>
            </TableBody>
          </Table>
        </Specimen>
        <Specimen title="Navigation">
          <div className="space-y-5">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem><BreadcrumbLink href="#">Home</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbLink href="#">Menopause</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>Hot flushes at work</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <Pagination>
              <PaginationContent>
                <PaginationItem><PaginationPrevious href="#" text="Previous" /></PaginationItem>
                <PaginationItem><PaginationLink href="#">1</PaginationLink></PaginationItem>
                <PaginationItem><PaginationLink href="#" isActive>2</PaginationLink></PaginationItem>
                <PaginationItem><PaginationLink href="#">3</PaginationLink></PaginationItem>
                <PaginationItem><PaginationEllipsis /></PaginationItem>
                <PaginationItem><PaginationNext href="#" text="Next" /></PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </Specimen>
      </div>

      <div className="grid gap-10 lg:grid-cols-3">
        <Specimen title="Avatar" note="Initials only for members. Photos only for experts who choose one.">
          <Row>
            <Avatar size="sm"><AvatarFallback>AF</AvatarFallback></Avatar>
            <Avatar><AvatarFallback>QR</AvatarFallback></Avatar>
            <Avatar size="lg"><AvatarFallback>AO</AvatarFallback></Avatar>
          </Row>
        </Specimen>
        <Specimen title="Loading" note="Skeleton pulse and spinner stop under reduced motion.">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
            <Row><Spinner /> <span className="text-sm text-muted-foreground">Checking your post</span></Row>
            <Progress value={60} aria-label="Onboarding progress" />
          </div>
        </Specimen>
        <Specimen title="Calendar" note="Day cells grow to 44px on touch.">
          <Calendar mode="single" selected={date} onSelect={setDate} defaultMonth={new Date(2026, 10, 1)} className="mx-auto rounded-lg" />
          <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <CalendarIcon className="size-3.5" aria-hidden /> Announcement scheduling
          </p>
        </Specimen>
      </div>
    </Section>
  )
}
