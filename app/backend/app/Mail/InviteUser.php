<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class InviteUser extends Mailable
{
    use Queueable, SerializesModels;

    public string $inviteeName;
    public string $inviterName;
    public string $inviteUrl;
    public string $temporaryPassword;

    public function __construct(
        string $inviteeName,
        string $inviterName,
        string $inviteUrl,
        string $temporaryPassword
    ) {
        $this->inviteeName       = $inviteeName;
        $this->inviterName       = $inviterName;
        $this->inviteUrl         = $inviteUrl;
        $this->temporaryPassword = $temporaryPassword;
    }

    public function build()
    {
        return $this
            ->subject("Your invitation to “".config('app.name')."”")
            ->markdown('emails.invite_user')
            ->with([
                'inviteeName'       => $this->inviteeName,
                'inviterName'       => $this->inviterName,
                'inviteUrl'         => $this->inviteUrl,
                'temporaryPassword' => $this->temporaryPassword,
            ]);
    }
}
