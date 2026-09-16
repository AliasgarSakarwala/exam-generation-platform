<x-mail::message>
{{-- resources/views/emails/invite_user.blade.php --}}

@component('mail::message')
# Hello {{ $inviteeName }},

**{{ $inviterName }}** has invited you to join **{{ config('app.name') }}**!

Your temporary password is:

@component('mail::panel')
**{{ $temporaryPassword }}**
@endcomponent

Click below to accept your invite, set your real password, and log in:

@component('mail::button', ['url' => $inviteUrl])
Accept Invitation
@endcomponent

If clicking doesn’t work, copy & paste:

{{ $inviteUrl }}

@endcomponent
</x-mail::message>
