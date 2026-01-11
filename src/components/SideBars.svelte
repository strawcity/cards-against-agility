<script>
	import classNames from 'classnames';
	import { gameStore } from './../stores/game-store';
</script>

<div
	class={classNames('absolute p-5 top-0 w-full -16 text-white flex justify-center items-center', {
		'bg-blue-700': $gameStore.isInRetro,
		'bg-black': !$gameStore.isInRetro
	})}
>
	{$gameStore.isInRetro ? 'R E T R O S P E C T I V E' : ' S P R I N T'}
</div>

<div
	class={classNames(
		'absolute p-5 h-screen w-16 right-0 whitespace-nowrap text-white flex justify-center items-center',
		{
			'bg-blue-700': $gameStore.isInRetro,
			'bg-black': !$gameStore.isInRetro
		}
	)}
>
	<div class="rotate-90">
		{$gameStore.isInRetro ? 'R E T R O S P E C T I V E' : ' S P R I N T'}
	</div>
</div>

<div
	class={classNames(
		'absolute p-5 h-screen w-16 left-0 whitespace-nowrap text-white flex justify-center items-center',
		{
			'bg-blue-700': $gameStore.isInRetro,
			'bg-black': !$gameStore.isInRetro
		}
	)}
>
	<div class="-rotate-90">
		{$gameStore.isInRetro ? 'R E T R O S P E C T I V E' : ' S P R I N T'}
	</div>
</div>
