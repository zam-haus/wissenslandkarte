<script lang="ts">
    import { navigate } from 'svelte-navigator';

    import Page from '../layout/Page.svelte';

    function cancel() {
        navigate(-1)
    }

    function submit() {
        console.log('submit!')
    }
</script>

<Page title="Sample" cancelHandler={cancel} submitHandler={submit}>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse bibendum cursus purus, sit amet fermentum neque elementum et. Curabitur scelerisque, sapien nec tempus laoreet, lorem purus aliquam nisi, nec sollicitudin quam ex nec odio. Suspendisse potenti. Duis vel massa elit. Proin a ipsum aliquet, volutpat ante eu, porta risus. Proin fermentum tempor dapibus. Vestibulum turpis lacus, pulvinar vel nisi in, laoreet convallis leo. Etiam sagittis interdum lectus, quis convallis tellus tempus non. Etiam faucibus vulputate ipsum. Nunc felis sapien, tristique eu mi vitae, suscipit laoreet urna. In faucibus eget orci id hendrerit. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.
    blandit rutrum risus nec condimentum. Fusce finibus sollicitudin neque, sed ultrices velit tincidunt vel. Donec in nibh placerat, commodo velit volutpat, rhoncus ipsum. Aenean tincidunt metus sit amet malesuada placerat. Praesent scelerisque ipsum at est dapibus feugiat. Cras sed urna consectetur, hendrerit ex vitae, laoreet odio. Curabitur vel odio eros. Proin euismod dui ac elementum vestibulum. Nam sed erat eget tortor dignissim fermentum sit amet eu felis. Morbi elit purus, gravida at nibh non, dapibus maximus leo. Duis commodo, odio et feugiat semper, sapien felis porta tellus, quis laoreet ligula sem nec arcu. Nullam euismod venenatis mauris, a interdum tortor mattis nec. Ut egestas auctor diam, ac consequat metus sagittis luctus. Mauris id libero in urna pretium porttitor eget non lorem. Aenean euismod imperdiet erat vel mattis. Fusce commodo odio ac posuere maximus.
    enas rutrum, magna ac tempor sodales, quam diam imperdiet quam, vitae fermentum ex orci et urna. Pellentesque id orci eget velit malesuada feugiat. Donec ut lorem at nisi bibendum tempus. Nam tristique sem est. Nulla interdum massa eu odio commodo placerat. Praesent condimentum nibh quis nunc ullamcorper, nec laoreet ex rhoncus. Proin bibendum magna et volutpat congue. Nam eleifend sapien ac lobortis tincidunt. In et ex at mi consequat imperdiet vel quis lacus. Donec nisi ipsum, pulvinar quis risus quis, tempus mattis nulla. Nulla facilisi. Nunc massa tellus, volutpat id neque et, sodales sollicitudin sem.
    elis libero, accumsan sed justo ac, tincidunt luctus tortor. Vivamus commodo nulla augue, sed tincidunt quam fermentum id. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Maecenas venenatis, erat eget mattis accumsan, odio diam lobortis odio, vitae consectetur nunc nisi vitae tortor. Ut a erat enim. Nam neque dui, gravida in mauris a, aliquet hendrerit augue. Nam eget nunc elit. In eget mauris libero. Integer nisi lectus, volutpat id ultrices vitae, gravida ac elit.
    vel est sed enim dignissim gravida quis et ligula. Proin tempus tellus ligula, rhoncus porttitor lacus hendrerit id. Pellentesque varius, risus molestie gravida rhoncus, lorem magna sollicitudin ex, nec molestie erat enim a orci. Cras facilisis lacus eu bibendum mollis. Etiam luctus enim non maximus mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Ut luctus aliquam faucibus. Suspendisse potenti. Duis facilisis quam nec erat luctus, feugiat cursus libero luctus. Nulla posuere, ipsum vel porttitor lobortis, tellus massa rutrum lectus, et tincidunt neque tellus a lacus. In laoreet imperdiet eros. Etiam cursus posuere lacinia. Mauris vitae tellus ut odio commodo efficitur at sed neque. Duis vehicula semper elementum. 

     <div class="footer" slot="footer">
        <p>
            🍅🍅🍅 Food stuff 🍅🍅🍅
        <p>
    </div>
</Page>

<style type="text/scss">
    .footer {
        display: flex;
        align-items: center;
        justify-content: center;
    }
</style>
