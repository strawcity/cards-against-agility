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
	style="left:calc(50vw + -32px)"
	class={classNames(
		'absolute p-5 w-full rotate-90 -16 text-white flex justify-center items-center',
		{
			'bg-blue-700': $gameStore.isInRetro,
			'bg-black': !$gameStore.isInRetro
		}
	)}
>
	{$gameStore.isInRetro ? 'R E T R O S P E C T I V E' : ' S P R I N T'}
</div>

<div
	style="right:calc(50vw + -32px)"
	class={classNames(
		'absolute p-5 w-full -rotate-90 -16 text-white flex justify-center items-center',
		{
			'bg-blue-700': $gameStore.isInRetro,
			'bg-black': !$gameStore.isInRetro
		}
	)}
>
	{$gameStore.isInRetro ? 'R E T R O S P E C T I V E' : ' S P R I N T'}
</div>
