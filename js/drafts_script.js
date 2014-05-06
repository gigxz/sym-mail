

function openDraft(draft) {
	// TODO should be going to compose, not read. drafts must have uids for this.
    window.location.href = 'http://localhost:8080/email/' + meta('boxname') + '/' + $(draft).attr('uid');
}